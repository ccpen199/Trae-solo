const db = require('../database');
const { generateId } = require('../utils/orderGenerator');
const { logAuditEvent, AUDIT_EVENT_TYPES } = require('./auditService');
const { ORDER_STATUSES, updateOrderStatus } = require('./orderStatusService');
const { createTodoForResponsiblePerson } = require('./todoService');

const createApprovalComment = (orderId, action, comment, operatorInfo = {}) => {
  const id = generateId('approval');
  
  const stmt = db.prepare(`
    INSERT INTO comments_approvals (id, order_id, operator_id, operator_name, operator_role, action, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    orderId,
    operatorInfo.operatorId,
    operatorInfo.operatorName,
    operatorInfo.operatorRole,
    action,
    comment
  );

  return id;
};

const saveShare = (orderId, shareData, operatorInfo = {}) => {
  const { screenshotIds = [], sharePlatforms = [], comment = null } = shareData;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  const validStatuses = [ORDER_STATUSES.TRYON_COMPLETED];
  if (!validStatuses.includes(order.status)) {
    return { success: false, message: `订单状态 ${order.status} 不允许保存分享` };
  }

  const transaction = db.transaction(() => {
    createApprovalComment(orderId, 'save_share', comment || '保存分享完成', operatorInfo);

    const updateResult = updateOrderStatus(orderId, ORDER_STATUSES.SHARED, {
      ...operatorInfo,
      action: 'save_share',
      reason: '保存分享完成'
    });

    if (!updateResult.success) {
      throw new Error(updateResult.message);
    }

    if (order.responsible_person) {
      createTodoForResponsiblePerson(orderId, order.responsible_person, ORDER_STATUSES.SHARED, operatorInfo);
    }

    logAuditEvent(AUDIT_EVENT_TYPES.ORDER_STATUS_CHANGED, {
      orderId,
      ...operatorInfo,
      detail: { action: 'save_share', screenshotIds, sharePlatforms }
    });

    const details = db.prepare('SELECT * FROM order_details WHERE order_id = ?').all(orderId);
    for (const detail of details) {
      db.prepare('UPDATE order_details SET status = ? WHERE id = ?').run('shared', detail.id);
    }

    return { success: true, order: updateResult.order };
  });

  try {
    return transaction();
  } catch (error) {
    console.error('保存分享失败:', error);
    return { success: false, message: error.message };
  }
};

const submitApproval = (orderId, operatorInfo = {}) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  if (order.status !== ORDER_STATUSES.SHARED) {
    return { success: false, message: `订单状态 ${order.status} 不允许提交审批` };
  }

  const transaction = db.transaction(() => {
    createApprovalComment(orderId, 'submit_approval', '提交下单审批', operatorInfo);

    const updateResult = updateOrderStatus(orderId, ORDER_STATUSES.PENDING_APPROVAL, {
      ...operatorInfo,
      action: 'submit_approval',
      reason: '提交下单审批'
    });

    if (!updateResult.success) {
      throw new Error(updateResult.message);
    }

    logAuditEvent(AUDIT_EVENT_TYPES.ORDER_STATUS_CHANGED, {
      orderId,
      ...operatorInfo,
      detail: { action: 'submit_approval' }
    });

    return { success: true, order: updateResult.order };
  });

  try {
    return transaction();
  } catch (error) {
    console.error('提交审批失败:', error);
    return { success: false, message: error.message };
  }
};

const approveOrder = (orderId, approvalData, operatorInfo = {}) => {
  const { comment = null } = approvalData;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  if (order.status !== ORDER_STATUSES.PENDING_APPROVAL) {
    return { success: false, message: `订单状态 ${order.status} 不允许审批` };
  }

  const details = db.prepare('SELECT * FROM order_details WHERE order_id = ?').all(orderId);
  for (const detail of details) {
    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(detail.product_id);
    if (!product || product.stock < detail.quantity) {
      return { success: false, message: `商品 ${detail.product_name} 库存不足` };
    }
  }

  const transaction = db.transaction(() => {
    createApprovalComment(orderId, 'approve', comment || '审批通过', operatorInfo);

    const updateResult = updateOrderStatus(orderId, ORDER_STATUSES.APPROVED, {
      ...operatorInfo,
      action: 'approve',
      reason: comment || '审批通过'
    });

    if (!updateResult.success) {
      throw new Error(updateResult.message);
    }

    logAuditEvent(AUDIT_EVENT_TYPES.ORDER_APPROVED, {
      orderId,
      ...operatorInfo,
      detail: { comment }
    });

    for (const detail of details) {
      db.prepare('UPDATE order_details SET status = ? WHERE id = ?').run('approved', detail.id);
    }

    return { success: true, order: updateResult.order };
  });

  try {
    return transaction();
  } catch (error) {
    console.error('审批通过失败:', error);
    return { success: false, message: error.message };
  }
};

const rejectOrder = (orderId, rejectionData, operatorInfo = {}) => {
  const { reason = '审批驳回', comment = null } = rejectionData;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  if (order.status !== ORDER_STATUSES.PENDING_APPROVAL) {
    return { success: false, message: `订单状态 ${order.status} 不允许驳回` };
  }

  const transaction = db.transaction(() => {
    createApprovalComment(orderId, 'reject', comment || reason, operatorInfo);

    const updateResult = updateOrderStatus(orderId, ORDER_STATUSES.REJECTED, {
      ...operatorInfo,
      action: 'reject',
      reason
    });

    if (!updateResult.success) {
      throw new Error(updateResult.message);
    }

    logAuditEvent(AUDIT_EVENT_TYPES.ORDER_REJECTED, {
      orderId,
      ...operatorInfo,
      detail: { reason, comment }
    });

    return { success: true, order: updateResult.order };
  });

  try {
    return transaction();
  } catch (error) {
    console.error('驳回失败:', error);
    return { success: false, message: error.message };
  }
};

const placeOrder = (orderId, operatorInfo = {}) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  if (order.status !== ORDER_STATUSES.APPROVED) {
    return { success: false, message: `订单状态 ${order.status} 不允许下单` };
  }

  const transaction = db.transaction(() => {
    const details = db.prepare('SELECT * FROM order_details WHERE order_id = ?').all(orderId);
    for (const detail of details) {
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(detail.quantity, detail.product_id);
      db.prepare('UPDATE order_details SET status = ? WHERE id = ?').run('ordered', detail.id);
    }

    const updateResult = updateOrderStatus(orderId, ORDER_STATUSES.ORDER_PLACED, {
      ...operatorInfo,
      action: 'place_order',
      reason: '下单完成'
    });

    if (!updateResult.success) {
      throw new Error(updateResult.message);
    }

    logAuditEvent(AUDIT_EVENT_TYPES.ORDER_PLACED, {
      orderId,
      ...operatorInfo,
      detail: { totalAmount: order.total_amount }
    });

    return { success: true, order: updateResult.order };
  });

  try {
    return transaction();
  } catch (error) {
    console.error('下单失败:', error);
    return { success: false, message: error.message };
  }
};

const reassign = (orderId, newResponsiblePerson, operatorInfo = {}) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(newResponsiblePerson);
  if (!newUser) {
    return { success: false, message: '目标责任人不存在' };
  }

  const transaction = db.transaction(() => {
    db.prepare('UPDATE orders SET responsible_person = ? WHERE id = ?').run(newResponsiblePerson, orderId);

    createApprovalComment(orderId, 'reassign', `转派给 ${newUser.name}`, operatorInfo);

    createTodoForResponsiblePerson(orderId, newResponsiblePerson, order.status, operatorInfo);

    logAuditEvent(AUDIT_EVENT_TYPES.ORDER_STATUS_CHANGED, {
      orderId,
      ...operatorInfo,
      detail: { action: 'reassign', newResponsiblePerson, newUserName: newUser.name }
    });

    return { success: true, order: { ...order, responsible_person: newResponsiblePerson } };
  });

  try {
    return transaction();
  } catch (error) {
    console.error('转派失败:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  saveShare,
  submitApproval,
  approveOrder,
  rejectOrder,
  placeOrder,
  reassign,
  createApprovalComment
};
