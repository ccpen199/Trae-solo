const db = require('../database');
const { generateId } = require('../utils/orderGenerator');
const { logAuditEvent, AUDIT_EVENT_TYPES } = require('./auditService');
const { createNotification, NOTIFICATION_TYPES } = require('./notificationService');

const TODO_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const TODO_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

const createTodo = (options) => {
  const {
    userId,
    userRole,
    orderId,
    title,
    priority = TODO_PRIORITIES.MEDIUM,
    dueTime = null,
    operatorId = null,
    operatorName = null,
    operatorRole = null
  } = options;

  const existingPendingTodo = db.prepare(`
    SELECT id FROM todos 
    WHERE user_id = ? AND order_id = ? AND status = ?
  `).get(userId, orderId, TODO_STATUSES.PENDING);

  if (existingPendingTodo) {
    return { id: existingPendingTodo.id, message: '待办已存在' };
  }

  const id = generateId('todo');
  
  const stmt = db.prepare(`
    INSERT INTO todos (id, user_id, user_role, order_id, title, priority, due_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, userId, userRole, orderId, title, priority, dueTime);
  
  createNotification({
    userId,
    userRole,
    orderId,
    title: `新待办：${title}`,
    content: `您有一个新的待办任务需要处理：${title}`,
    type: NOTIFICATION_TYPES.TODO_ASSIGNED,
    operatorId,
    operatorName,
    operatorRole
  });
  
  logAuditEvent(AUDIT_EVENT_TYPES.TODO_ASSIGNED, {
    orderId,
    operatorId,
    operatorName,
    operatorRole,
    detail: { todoId: id, userId, title }
  });

  return { id, ...options };
};

const createTodoForResponsiblePerson = (orderId, responsiblePersonId, orderStatus, operatorInfo = {}) => {
  const statusTitles = {
    'camera_opened': '待执行人脸/人体识别',
    'recognition_completed': '待叠加商品',
    'tryon_completed': '待保存分享',
    'shared': '待下单审批',
    'order_placed': '待确认'
  };

  const user = db.prepare('SELECT id, role, name FROM users WHERE id = ?').get(responsiblePersonId);
  if (!user) {
    const guide = db.prepare("SELECT id, role, name FROM users WHERE role = 'guide' LIMIT 1").get();
    if (guide) {
      user = guide;
    } else {
      return null;
    }
  }

  const title = statusTitles[orderStatus] || '待处理';
  
  return createTodo({
    userId: user.id,
    userRole: user.role,
    orderId,
    title,
    priority: TODO_PRIORITIES.HIGH,
    ...operatorInfo
  });
};

const getUserTodos = (userId, options = {}) => {
  const { status = null, limit = 50, offset = 0 } = options;
  
  let sql = `
    SELECT t.*, o.order_no, o.consumer_name, o.status as order_status
    FROM todos t
    LEFT JOIN orders o ON t.order_id = o.id
    WHERE t.user_id = ?
  `;
  const params = [userId];
  
  if (status) {
    sql += ' AND t.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  return db.prepare(sql).all(...params);
};

const updateTodoStatus = (todoId, userId, status, operatorInfo = {}) => {
  const todo = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(todoId, userId);
  
  if (!todo) {
    return { success: false, message: '待办不存在或无权限' };
  }

  const completedAt = status === TODO_STATUSES.COMPLETED ? "datetime('now')" : null;
  
  const stmt = db.prepare(`
    UPDATE todos 
    SET status = ?, completed_at = ${completedAt}
    WHERE id = ?
  `);
  
  const result = stmt.run(status, todoId);
  
  if (result.changes > 0) {
    logAuditEvent(AUDIT_EVENT_TYPES.TODO_COMPLETED, {
      orderId: todo.order_id,
      operatorId: operatorInfo.operatorId || userId,
      operatorName: operatorInfo.operatorName,
      operatorRole: operatorInfo.operatorRole,
      detail: { todoId, status }
    });
  }
  
  return { success: result.changes > 0 };
};

const getPendingTodoCount = (userId) => {
  const result = db.prepare(`
    SELECT COUNT(*) as count 
    FROM todos 
    WHERE user_id = ? AND status = ?
  `).get(userId, TODO_STATUSES.PENDING);
  
  return result.count;
};

const cancelOrderTodos = (orderId, operatorInfo = {}) => {
  const stmt = db.prepare(`
    UPDATE todos 
    SET status = ? 
    WHERE order_id = ? AND status IN (?, ?)
  `);
  
  const result = stmt.run(
    TODO_STATUSES.CANCELLED,
    orderId,
    TODO_STATUSES.PENDING,
    TODO_STATUSES.IN_PROGRESS
  );
  
  if (result.changes > 0) {
    logAuditEvent(AUDIT_EVENT_TYPES.ORDER_STATUS_CHANGED, {
      orderId,
      ...operatorInfo,
      detail: { action: 'cancel_todos', count: result.changes }
    });
  }
  
  return result.changes;
};

module.exports = {
  TODO_STATUSES,
  TODO_PRIORITIES,
  createTodo,
  createTodoForResponsiblePerson,
  getUserTodos,
  updateTodoStatus,
  getPendingTodoCount,
  cancelOrderTodos
};
