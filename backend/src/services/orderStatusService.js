const db = require('../database');
const { generateId } = require('../utils/orderGenerator');
const { logAuditEvent, AUDIT_EVENT_TYPES } = require('./auditService');
const { createTodoForResponsiblePerson, cancelOrderTodos } = require('./todoService');
const { createNotificationsForRoles, NOTIFICATION_TYPES } = require('./notificationService');

const ORDER_STATUSES = {
  DRAFT: 'draft',
  CAMERA_OPENED: 'camera_opened',
  PENDING_RECOGNITION: 'pending_recognition',
  RECOGNITION_IN_PROGRESS: 'recognition_in_progress',
  RECOGNITION_COMPLETED: 'recognition_completed',
  PENDING_TRYON: 'pending_tryon',
  TRYON_IN_PROGRESS: 'tryon_in_progress',
  TRYON_COMPLETED: 'tryon_completed',
  SHARED: 'shared',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ORDER_PLACED: 'order_placed',
  PAID: 'paid',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REVERSED: 'reversed'
};

const STATUS_TRANSITIONS = {
  [ORDER_STATUSES.DRAFT]: [ORDER_STATUSES.CAMERA_OPENED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.CAMERA_OPENED]: [ORDER_STATUSES.PENDING_RECOGNITION, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PENDING_RECOGNITION]: [ORDER_STATUSES.RECOGNITION_IN_PROGRESS, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.RECOGNITION_IN_PROGRESS]: [ORDER_STATUSES.RECOGNITION_COMPLETED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.RECOGNITION_COMPLETED]: [ORDER_STATUSES.PENDING_TRYON, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PENDING_TRYON]: [ORDER_STATUSES.TRYON_IN_PROGRESS, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.TRYON_IN_PROGRESS]: [ORDER_STATUSES.TRYON_COMPLETED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.TRYON_COMPLETED]: [ORDER_STATUSES.SHARED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.SHARED]: [ORDER_STATUSES.PENDING_APPROVAL, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PENDING_APPROVAL]: [ORDER_STATUSES.APPROVED, ORDER_STATUSES.REJECTED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.APPROVED]: [ORDER_STATUSES.ORDER_PLACED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.REJECTED]: [ORDER_STATUSES.PENDING_APPROVAL, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.ORDER_PLACED]: [ORDER_STATUSES.PAID, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PAID]: [ORDER_STATUSES.SHIPPED, ORDER_STATUSES.REVERSED],
  [ORDER_STATUSES.SHIPPED]: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.REVERSED],
  [ORDER_STATUSES.COMPLETED]: [ORDER_STATUSES.REVERSED],
  [ORDER_STATUSES.CANCELLED]: [],
  [ORDER_STATUSES.REVERSED]: []
};

const checkTransitionAllowed = (fromStatus, toStatus) => {
  const allowedTransitions = STATUS_TRANSITIONS[fromStatus] || [];
  return allowedTransitions.includes(toStatus);
};

const createStatusFlow = (options) => {
  const {
    orderId,
    fromStatus,
    toStatus,
    operatorId,
    operatorName,
    operatorRole,
    action = 'status_change',
    reason = null
  } = options;

  const id = generateId('flow');
  
  const stmt = db.prepare(`
    INSERT INTO status_flows (id, order_id, from_status, to_status, operator_id, operator_name, operator_role, action, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, orderId, fromStatus, toStatus, operatorId, operatorName, operatorRole, action, reason);
  
  return id;
};

const updateOrderStatus = (orderId, newStatus, options = {}) => {
  const {
    operatorId,
    operatorName,
    operatorRole,
    action = 'status_change',
    reason = null,
    responsiblePerson = null
  } = options;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  if (order.status === newStatus) {
    return { success: true, message: '状态未变化', order };
  }

  if (!checkTransitionAllowed(order.status, newStatus)) {
    return { 
      success: false, 
      message: `不允许的状态转换: ${order.status} -> ${newStatus}` 
    };
  }

  const transaction = db.transaction(() => {
    createStatusFlow({
      orderId,
      fromStatus: order.status,
      toStatus: newStatus,
      operatorId,
      operatorName,
      operatorRole,
      action,
      reason
    });

    const updateStmt = db.prepare(`
      UPDATE orders 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    updateStmt.run(newStatus, orderId);

    logAuditEvent(AUDIT_EVENT_TYPES.ORDER_STATUS_CHANGED, {
      orderId,
      operatorId,
      operatorName,
      operatorRole,
      detail: {
        fromStatus: order.status,
        toStatus: newStatus,
        action,
        reason
      }
    });

    if (newStatus === ORDER_STATUSES.CANCELLED || newStatus === ORDER_STATUSES.REVERSED) {
      cancelOrderTodos(orderId, { operatorId, operatorName, operatorRole });
    }

    const statusNotifications = {
      [ORDER_STATUSES.RECOGNITION_COMPLETED]: {
        title: '识别已完成，等待叠加商品',
        roles: ['guide', 'operator'],
        type: NOTIFICATION_TYPES.ORDER_STATUS_CHANGED
      },
      [ORDER_STATUSES.TRYON_COMPLETED]: {
        title: '试穿已完成，等待保存分享',
        roles: ['guide', 'consumer'],
        type: NOTIFICATION_TYPES.TRYON_COMPLETED
      },
      [ORDER_STATUSES.PENDING_APPROVAL]: {
        title: '订单等待审批',
        roles: ['brand', 'operator'],
        type: NOTIFICATION_TYPES.APPROVAL_NEEDED
      },
      [ORDER_STATUSES.APPROVED]: {
        title: '订单已审批通过',
        roles: ['consumer', 'guide'],
        type: NOTIFICATION_TYPES.APPROVAL_RESULT
      },
      [ORDER_STATUSES.REJECTED]: {
        title: '订单已被驳回',
        roles: ['consumer', 'guide'],
        type: NOTIFICATION_TYPES.APPROVAL_RESULT
      },
      [ORDER_STATUSES.ORDER_PLACED]: {
        title: '订单已下单',
        roles: ['operator', 'brand'],
        type: NOTIFICATION_TYPES.ORDER_STATUS_CHANGED
      }
    };

    const notificationConfig = statusNotifications[newStatus];
    if (notificationConfig) {
      createNotificationsForRoles({
        roles: notificationConfig.roles,
        orderId,
        title: notificationConfig.title,
        type: notificationConfig.type,
        operatorId,
        operatorName,
        operatorRole
      });
    }

    if (responsiblePerson) {
      createTodoForResponsiblePerson(orderId, responsiblePerson, newStatus, {
        operatorId,
        operatorName,
        operatorRole
      });
    }

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    return { success: true, order: updatedOrder };
  });

  try {
    return transaction();
  } catch (error) {
    console.error('状态更新失败:', error);
    return { success: false, message: error.message };
  }
};

const getOrderStatusFlows = (orderId) => {
  return db.prepare(`
    SELECT * FROM status_flows 
    WHERE order_id = ? 
    ORDER BY created_at ASC
  `).all(orderId);
};

const getStatusTimeline = (orderId) => {
  const flows = getOrderStatusFlows(orderId);
  const approvals = db.prepare(`
    SELECT * FROM comments_approvals 
    WHERE order_id = ? 
    ORDER BY created_at ASC
  `).all(orderId);

  const timeline = [
    ...flows.map(f => ({
      ...f,
      timelineType: 'status',
      timestamp: f.created_at
    })),
    ...approvals.map(a => ({
      ...a,
      timelineType: 'approval',
      timestamp: a.created_at
    }))
  ];

  return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

module.exports = {
  ORDER_STATUSES,
  STATUS_TRANSITIONS,
  checkTransitionAllowed,
  createStatusFlow,
  updateOrderStatus,
  getOrderStatusFlows,
  getStatusTimeline
};
