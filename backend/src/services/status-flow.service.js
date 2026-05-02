const { getDb } = require('../database/init');
const { generateId, stringifyJSON } = require('../utils/common');
const notificationService = require('./notification.service');
const todoService = require('./todo.service');

const db = getDb();

const STEPS = {
  ORG_SYNC: 'org_sync',
  CHAT_COMMUNICATION: 'chat_communication',
  FILE_SEND: 'file_send',
  TASK_NOTIFICATION: 'task_notification',
  ARCHIVE: 'archive',
};

const STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEED_SUPPLEMENT: 'need_supplement',
  TRANSFERRED: 'transferred',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
};

const createStatusFlow = (options) => {
  const {
    mainOrderId,
    detailId,
    fromStatus,
    toStatus,
    fromStep,
    toStep,
    operatorId,
    operatorType = 'employee',
    action,
    reason,
    remark,
    dataSnapshot,
  } = options;

  const id = generateId();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO status_flow (
      id, main_order_id, detail_id, from_status, to_status,
      from_step, to_step, operator_id, operator_type,
      action, reason, remark, data_snapshot, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, mainOrderId, detailId, fromStatus, toStatus,
    fromStep, toStep, operatorId, operatorType,
    action, reason, remark, stringifyJSON(dataSnapshot), createdAt
  );

  return { id, ...options, createdAt };
};

const getStatusFlow = (mainOrderId, options = {}) => {
  const { detailId, limit = 100, offset = 0 } = options;
  let sql = `
    SELECT sf.*,
           m.name as operator_name, m.avatar as operator_avatar
    FROM status_flow sf
    LEFT JOIN employees m ON sf.operator_id = m.id
    WHERE sf.main_order_id = ?
  `;
  const params = [mainOrderId];

  if (detailId) {
    sql += ' AND sf.detail_id = ?';
    params.push(detailId);
  }

  sql += ' ORDER BY sf.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(sql).all(...params);
};

const transitionStep = (mainOrderId, options) => {
  const {
    fromStep,
    toStep,
    fromStatus,
    toStatus,
    operatorId,
    action,
    reason,
    remark,
    nextOwnerId,
  } = options;

  const now = new Date().toISOString();
  const order = db.prepare('SELECT * FROM main_orders WHERE id = ?').get(mainOrderId);

  if (!order) {
    throw new Error('主单不存在');
  }

  createStatusFlow({
    mainOrderId,
    fromStatus: fromStatus || order.status,
    toStatus,
    fromStep: fromStep || order.current_step,
    toStep,
    operatorId,
    action,
    reason,
    remark,
    dataSnapshot: order,
  });

  const updateStmt = db.prepare(`
    UPDATE main_orders 
    SET status = ?, current_step = ?, current_owner_id = ?, updated_at = ?
    WHERE id = ?
  `);

  updateStmt.run(toStatus, toStep, nextOwnerId, now, mainOrderId);

  todoService.deleteTodosByOrder(mainOrderId, { step: fromStep || order.current_step });

  if (nextOwnerId && toStep !== STEPS.ARCHIVE) {
    const stepTitles = {
      [STEPS.ORG_SYNC]: '组织同步待处理',
      [STEPS.CHAT_COMMUNICATION]: '聊天沟通待处理',
      [STEPS.FILE_SEND]: '文件发送待处理',
      [STEPS.TASK_NOTIFICATION]: '任务通知待审批',
      [STEPS.ARCHIVE]: '归档待处理',
    };

    todoService.createTodo({
      ownerId: nextOwnerId,
      mainOrderId,
      step: toStep,
      title: stepTitles[toStep] || `步骤${toStep}待处理`,
      description: `主单${order.order_no}需要您处理`,
      priority: order.priority,
    });

    notificationService.createNotification({
      receiverId: nextOwnerId,
      type: 'todo',
      title: stepTitles[toStep] || `新的待办任务`,
      content: `主单${order.order_no}已流转到您，请及时处理`,
      relatedType: 'main_order',
      relatedId: mainOrderId,
      relatedStep: toStep,
    });
  }

  return { success: true };
};

const getAvailableActions = (step, status, userRole) => {
  const actionMap = {
    [STEPS.ORG_SYNC]: {
      [STATUS.DRAFT]: ['submit', 'save_draft', 'cancel'],
      [STATUS.PENDING]: ['process', 'transfer'],
    },
    [STEPS.CHAT_COMMUNICATION]: {
      [STATUS.PENDING]: ['process', 'complete', 'transfer'],
      [STATUS.PROCESSING]: ['complete', 'reject'],
    },
    [STEPS.FILE_SEND]: {
      [STATUS.PENDING]: ['send_file', 'complete', 'transfer'],
    },
    [STEPS.TASK_NOTIFICATION]: {
      [STATUS.PENDING]: ['approve', 'reject', 'need_supplement', 'transfer'],
    },
    [STEPS.ARCHIVE]: {
      [STATUS.PENDING]: ['archive'],
    },
  };

  const stepActions = actionMap[step];
  if (!stepActions) return [];

  return stepActions[status] || [];
};

module.exports = {
  STEPS,
  STATUS,
  createStatusFlow,
  getStatusFlow,
  transitionStep,
  getAvailableActions,
};
