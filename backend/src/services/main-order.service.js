const { getDb } = require('../database/init');
const { generateId, generateOrderNo, stringifyJSON, parseJSON } = require('../utils/common');
const statusFlowService = require('./status-flow.service');
const notificationService = require('./notification.service');
const todoService = require('./todo.service');
const auditService = require('./audit.service');

const db = getDb();
const { STEPS, STATUS } = statusFlowService;

const createMainOrder = (options) => {
  const {
    type,
    title,
    description,
    initiatorId,
    currentOwnerId,
    expectedTime,
    priority = 'normal',
    dataContent,
  } = options;

  const id = generateId();
  const orderNo = generateOrderNo('IM');
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO main_orders (
      id, order_no, type, title, description, status, current_step,
      initiator_id, current_owner_id, expected_time, priority,
      data_content, lock_version, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);

  stmt.run(
    id, orderNo, type, title, description, STATUS.DRAFT, STEPS.ORG_SYNC,
    initiatorId, currentOwnerId || initiatorId, expectedTime, priority,
    stringifyJSON(dataContent), now, now
  );

  return {
    id,
    orderNo,
    ...options,
    status: STATUS.DRAFT,
    currentStep: STEPS.ORG_SYNC,
    lockVersion: 0,
    createdAt: now,
  };
};

const getMainOrder = (id) => {
  const row = db.prepare(`
    SELECT mo.*,
           m1.name as initiator_name, m1.avatar as initiator_avatar,
           m1.role_id as initiator_role_id,
           m2.name as current_owner_name, m2.avatar as current_owner_avatar,
           r1.code as initiator_role_code,
           r2.name as initiator_role_name,
           d.name as department_name
    FROM main_orders mo
    LEFT JOIN employees m1 ON mo.initiator_id = m1.id
    LEFT JOIN employees m2 ON mo.current_owner_id = m2.id
    LEFT JOIN roles r1 ON m1.role_id = r1.id
    LEFT JOIN departments d ON m1.department_id = d.id
    WHERE mo.id = ?
  `).get(id);

  if (!row) return null;

  return {
    ...row,
    dataContent: parseJSON(row.data_content),
  };
};

const getMainOrders = (options = {}) => {
  const {
    initiatorId,
    currentOwnerId,
    status,
    currentStep,
    type,
    limit = 50,
    offset = 0,
  } = options;

  let sql = `
    SELECT mo.*,
           m1.name as initiator_name, m1.avatar as initiator_avatar,
           m2.name as current_owner_name, m2.avatar as current_owner_avatar
    FROM main_orders mo
    LEFT JOIN employees m1 ON mo.initiator_id = m1.id
    LEFT JOIN employees m2 ON mo.current_owner_id = m2.id
    WHERE 1=1
  `;
  const params = [];

  if (initiatorId) {
    sql += ' AND mo.initiator_id = ?';
    params.push(initiatorId);
  }

  if (currentOwnerId) {
    sql += ' AND mo.current_owner_id = ?';
    params.push(currentOwnerId);
  }

  if (status) {
    sql += ' AND mo.status = ?';
    params.push(status);
  }

  if (currentStep) {
    sql += ' AND mo.current_step = ?';
    params.push(currentStep);
  }

  if (type) {
    sql += ' AND mo.type = ?';
    params.push(type);
  }

  sql += ' ORDER BY mo.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params);
  return rows.map(row => ({
    ...row,
    dataContent: parseJSON(row.data_content),
  }));
};

const updateMainOrder = (id, updates) => {
  const allowedFields = [
    'title', 'description', 'expected_time', 'priority',
    'data_content', 'current_owner_id', 'chat_ids'
  ];

  const fields = [];
  const values = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.expectedTime !== undefined) {
    fields.push('expected_time = ?');
    values.push(updates.expectedTime);
  }
  if (updates.priority !== undefined) {
    fields.push('priority = ?');
    values.push(updates.priority);
  }
  if (updates.dataContent !== undefined) {
    fields.push('data_content = ?');
    values.push(stringifyJSON(updates.dataContent));
  }
  if (updates.currentOwnerId !== undefined) {
    fields.push('current_owner_id = ?');
    values.push(updates.currentOwnerId);
  }
  if (updates.chatIds !== undefined) {
    fields.push('chat_ids = ?');
    values.push(stringifyJSON(updates.chatIds));
  }

  if (fields.length === 0) {
    return { success: false, message: '没有可更新的字段' };
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = db.prepare(`UPDATE main_orders SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return { success: true };
};

const getDepartmentLeader = (departmentId) => {
  const row = db.prepare(`
    SELECT e.id, e.name, r.code as role_code
    FROM departments d
    LEFT JOIN employees e ON d.leader_id = e.id
    LEFT JOIN roles r ON e.role_id = r.id
    WHERE d.id = ?
  `).get(departmentId);
  return row;
};

const getAdmin = () => {
  const rows = db.prepare(`
    SELECT e.id, e.name, r.code as role_code
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    WHERE r.code = 'admin' AND e.status = 1
  `).all();
  return rows && rows.length > 0 ? rows[0] : null;
};

const autoAssignApprover = (initiatorId) => {
  const initiator = db.prepare(`
    SELECT e.id, e.name, e.department_id, r.code as role_code
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    WHERE e.id = ?
  `).get(initiatorId);

  if (!initiator) {
    return null;
  }

  if (initiator.role_code === 'admin') {
    return initiator.id;
  }

  if (initiator.role_code === 'dept_leader') {
    const admin = getAdmin();
    return admin ? admin.id : initiator.id;
  }

  const deptLeader = getDepartmentLeader(initiator.department_id);
  if (deptLeader && deptLeader.id) {
    return deptLeader.id;
  }

  const admin = getAdmin();
  return admin ? admin.id : initiator.id;
};

const getApproverCandidates = (initiatorId) => {
  const rows = db.prepare(`
    SELECT e.id, e.name, r.code as role_code, d.name as department_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.status = 1 AND r.code IN ('admin', 'dept_leader')
    ORDER BY r.code DESC, e.name ASC
  `).all();
  return rows;
};

const submitOrgSync = (mainOrderId, operatorId, data) => {
  const order = getMainOrder(mainOrderId);
  if (!order) throw new Error('主单不存在');

  if (order.status !== STATUS.DRAFT) {
    throw new Error('只有草稿状态可以提交');
  }

  const requiredFields = ['contacts', 'responsiblePersonId'];
  const content = { ...order.dataContent, ...data };
  const missingFields = requiredFields.filter(f => !content[f]);
  if (missingFields.length > 0) {
    throw new Error(`缺少必填字段: ${missingFields.join(', ')}`);
  }

  let approverId = data.approverId;
  if (!approverId) {
    approverId = autoAssignApprover(order.initiator_id);
  }
  content.approverId = approverId;

  updateMainOrder(mainOrderId, { dataContent: content });

  statusFlowService.transitionStep(mainOrderId, {
    fromStatus: STATUS.DRAFT,
    toStatus: STATUS.PENDING,
    toStep: STEPS.CHAT_COMMUNICATION,
    operatorId,
    action: 'submit',
    reason: '提交组织同步',
    nextOwnerId: content.responsiblePersonId,
  });

  auditService.createAuditLog({
    operatorId,
    module: 'org_sync',
    action: 'submit',
    targetType: 'main_order',
    targetId: mainOrderId,
    remark: `提交组织同步，审批人ID: ${approverId}`,
  });

  return { success: true, approverId };
};

const processChatCommunication = (mainOrderId, operatorId, action, data) => {
  const order = getMainOrder(mainOrderId);
  if (!order) throw new Error('主单不存在');

  if (order.current_step !== STEPS.CHAT_COMMUNICATION) {
    throw new Error('当前不在聊天沟通阶段');
  }

  if (order.current_owner_id !== operatorId) {
    throw new Error('只有当前负责人才能执行此操作');
  }

  let toStatus, toStep, nextOwnerId, actionResult;

  switch (action) {
    case 'complete':
      toStatus = STATUS.PENDING;
      toStep = STEPS.FILE_SEND;
      nextOwnerId = order.initiator_id;
      actionResult = 'completed';
      break;
    case 'reject':
      toStatus = STATUS.REJECTED;
      toStep = STEPS.ORG_SYNC;
      nextOwnerId = order.initiator_id;
      actionResult = 'rejected';
      break;
    case 'transfer':
      if (!data.nextOwnerId) throw new Error('转派需要指定接收人');
      toStatus = STATUS.PENDING;
      toStep = STEPS.CHAT_COMMUNICATION;
      nextOwnerId = data.nextOwnerId;
      actionResult = 'transferred';
      break;
    default:
      throw new Error(`不支持的操作: ${action}`);
  }

  const commentStmt = db.prepare(`
    INSERT INTO comments_approvals (
      id, main_order_id, type, operator_id, action, content, result, next_owner_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const commentId = generateId();
  commentStmt.run(
    commentId, mainOrderId, 'process', operatorId, action,
    data?.remark || '', actionResult, nextOwnerId,
    new Date().toISOString()
  );

  statusFlowService.transitionStep(mainOrderId, {
    fromStatus: order.status,
    toStatus,
    toStep,
    operatorId,
    action,
    reason: data?.remark,
    nextOwnerId,
  });

  auditService.createAuditLog({
    operatorId,
    module: 'chat_communication',
    action,
    targetType: 'main_order',
    targetId: mainOrderId,
    remark: `执行操作: ${action}`,
  });

  return { success: true };
};

const processFileSend = (mainOrderId, operatorId, action, data) => {
  const order = getMainOrder(mainOrderId);
  if (!order) throw new Error('主单不存在');

  if (order.current_step !== STEPS.FILE_SEND) {
    throw new Error('当前不在文件发送阶段');
  }

  if (order.current_owner_id !== operatorId) {
    throw new Error('只有当前负责人才能执行此操作');
  }

  const content = order.dataContent || {};
  let toStatus, toStep, nextOwnerId;

  switch (action) {
    case 'send_file':
    case 'complete':
      toStatus = STATUS.PENDING;
      toStep = STEPS.TASK_NOTIFICATION;
      nextOwnerId = content.approverId || order.initiator_id;
      if (!content.approverId) {
        nextOwnerId = autoAssignApprover(order.initiator_id);
      }
      break;
    case 'transfer':
      if (!data.nextOwnerId) throw new Error('转派需要指定接收人');
      toStatus = STATUS.PENDING;
      toStep = STEPS.FILE_SEND;
      nextOwnerId = data.nextOwnerId;
      break;
    default:
      throw new Error(`不支持的操作: ${action}`);
  }

  if (data.attachments && data.attachments.length > 0) {
    const attachStmt = db.prepare(`
      INSERT INTO attachments (
        id, main_order_id, file_name, original_name, file_path, file_size, file_type, owner_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const attach of data.attachments) {
      const attachId = generateId();
      attachStmt.run(
        attachId, mainOrderId, attach.fileName, attach.originalName,
        attach.filePath, attach.fileSize, attach.fileType, operatorId,
        new Date().toISOString()
      );
    }
  }

  statusFlowService.transitionStep(mainOrderId, {
    fromStatus: order.status,
    toStatus,
    toStep,
    operatorId,
    action,
    reason: data?.remark,
    nextOwnerId,
  });

  auditService.createAuditLog({
    operatorId,
    module: 'file_send',
    action,
    targetType: 'main_order',
    targetId: mainOrderId,
    remark: `文件发送操作: ${action}，下一步审批人: ${nextOwnerId}`,
  });

  return { success: true };
};

const processTaskNotification = (mainOrderId, operatorId, action, data) => {
  const order = getMainOrder(mainOrderId);
  if (!order) throw new Error('主单不存在');

  if (order.current_step !== STEPS.TASK_NOTIFICATION) {
    throw new Error('当前不在任务通知阶段');
  }

  if (order.current_owner_id !== operatorId) {
    throw new Error('只有当前负责人（审批人）才能执行此操作');
  }

  const content = order.dataContent || {};
  const approverId = content.approverId;

  if (approverId && approverId !== operatorId) {
    throw new Error('只有指定的审批人才能执行此操作');
  }

  let toStatus, toStep, nextOwnerId, actionResult;

  switch (action) {
    case 'approve':
      toStatus = STATUS.APPROVED;
      toStep = STEPS.ARCHIVE;
      nextOwnerId = order.initiator_id;
      actionResult = 'approved';
      break;
    case 'reject':
      toStatus = STATUS.REJECTED;
      toStep = STEPS.FILE_SEND;
      nextOwnerId = order.initiator_id;
      actionResult = 'rejected';
      break;
    case 'need_supplement':
      toStatus = STATUS.NEED_SUPPLEMENT;
      toStep = STEPS.ORG_SYNC;
      nextOwnerId = order.initiator_id;
      actionResult = 'need_supplement';
      break;
    case 'transfer':
      if (!data.nextOwnerId) throw new Error('转派需要指定接收人');
      toStatus = STATUS.PENDING;
      toStep = STEPS.TASK_NOTIFICATION;
      nextOwnerId = data.nextOwnerId;
      actionResult = 'transferred';
      break;
    default:
      throw new Error(`不支持的操作: ${action}`);
  }

  const commentStmt = db.prepare(`
    INSERT INTO comments_approvals (
      id, main_order_id, type, operator_id, action, content, result, next_owner_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const commentId = generateId();
  commentStmt.run(
    commentId, mainOrderId, 'approval', operatorId, action,
    data?.remark || '', actionResult, nextOwnerId,
    new Date().toISOString()
  );

  statusFlowService.transitionStep(mainOrderId, {
    fromStatus: order.status,
    toStatus,
    toStep,
    operatorId,
    action,
    reason: data?.remark,
    nextOwnerId,
  });

  auditService.createAuditLog({
    operatorId,
    module: 'task_notification',
    action,
    targetType: 'main_order',
    targetId: mainOrderId,
    remark: `审批操作: ${action}`,
  });

  return { success: true };
};

const processArchive = (mainOrderId, operatorId, data) => {
  const order = getMainOrder(mainOrderId);
  if (!order) throw new Error('主单不存在');

  if (order.current_step !== STEPS.ARCHIVE) {
    throw new Error('当前不在归档阶段');
  }

  if (order.current_owner_id !== operatorId) {
    throw new Error('只有当前负责人才能执行归档操作');
  }

  if (order.status !== STATUS.APPROVED && order.status !== STATUS.PENDING) {
    throw new Error('只有审批通过后才能归档');
  }

  statusFlowService.transitionStep(mainOrderId, {
    fromStatus: order.status,
    toStatus: STATUS.ARCHIVED,
    toStep: STEPS.ARCHIVE,
    operatorId,
    action: 'archive',
    reason: data?.remark,
  });

  auditService.createAuditLog({
    operatorId,
    module: 'archive',
    action: 'archive',
    targetType: 'main_order',
    targetId: mainOrderId,
    remark: '归档完成',
  });

  return { success: true };
};

const getComments = (mainOrderId) => {
  return db.prepare(`
    SELECT ca.*,
           m.name as operator_name, m.avatar as operator_avatar,
           nm.name as next_owner_name
    FROM comments_approvals ca
    LEFT JOIN employees m ON ca.operator_id = m.id
    LEFT JOIN employees nm ON ca.next_owner_id = nm.id
    WHERE ca.main_order_id = ?
    ORDER BY ca.created_at DESC
  `).all(mainOrderId);
};

module.exports = {
  createMainOrder,
  getMainOrder,
  getMainOrders,
  updateMainOrder,
  submitOrgSync,
  processChatCommunication,
  processFileSend,
  processTaskNotification,
  processArchive,
  getComments,
  getApproverCandidates,
  autoAssignApprover,
};
