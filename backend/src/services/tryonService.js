const db = require('../database');
const { generateId } = require('../utils/orderGenerator');
const { logAuditEvent, AUDIT_EVENT_TYPES } = require('./auditService');
const { ORDER_STATUSES, updateOrderStatus } = require('./orderStatusService');
const { createTodoForResponsiblePerson } = require('./todoService');
const { addOrderDetail } = require('./orderService');

const lockModel3D = (modelId, operatorId) => {
  const model = db.prepare('SELECT * FROM models_3d WHERE id = ?').get(modelId);
  
  if (!model) {
    return { success: false, message: '3D模型不存在' };
  }

  if (model.is_locked && model.locked_by !== operatorId) {
    return { success: false, message: '3D模型已被其他用户锁定' };
  }

  const stmt = db.prepare(`
    UPDATE models_3d 
    SET is_locked = 1, locked_by = ?, locked_at = datetime('now')
    WHERE id = ?
  `);
  
  stmt.run(operatorId, modelId);

  logAuditEvent(AUDIT_EVENT_TYPES.MODEL_3D_LOCKED, {
    operatorId,
    detail: { modelId, modelName: model.name }
  });

  return { success: true, model: { ...model, is_locked: 1, locked_by: operatorId } };
};

const unlockModel3D = (modelId, operatorId) => {
  const model = db.prepare('SELECT * FROM models_3d WHERE id = ?').get(modelId);
  
  if (!model) {
    return { success: false, message: '3D模型不存在' };
  }

  const stmt = db.prepare(`
    UPDATE models_3d 
    SET is_locked = 0, locked_by = NULL, locked_at = NULL
    WHERE id = ?
  `);
  
  stmt.run(modelId);

  logAuditEvent(AUDIT_EVENT_TYPES.MODEL_3D_UNLOCKED, {
    operatorId,
    detail: { modelId, modelName: model.name }
  });

  return { success: true };
};

const startTryon = (orderId, productId, operatorInfo = {}) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  const validStatuses = [ORDER_STATUSES.RECOGNITION_COMPLETED, ORDER_STATUSES.PENDING_TRYON];
  if (!validStatuses.includes(order.status)) {
    return { success: false, message: `订单状态 ${order.status} 不允许开始试穿` };
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) {
    return { success: false, message: '商品不存在' };
  }

  const transaction = db.transaction(() => {
    if (product.model_3d_id) {
      const lockResult = lockModel3D(product.model_3d_id, operatorInfo.operatorId);
      if (!lockResult.success) {
        throw new Error(lockResult.message);
      }
    }

    const updateResult = updateOrderStatus(orderId, ORDER_STATUSES.TRYON_IN_PROGRESS, {
      ...operatorInfo,
      action: 'start_tryon',
      reason: '开始叠加商品试穿'
    });

    if (!updateResult.success) {
      throw new Error(updateResult.message);
    }

    logAuditEvent(AUDIT_EVENT_TYPES.ORDER_STATUS_CHANGED, {
      orderId,
      ...operatorInfo,
      detail: { action: 'start_tryon', productId, productName: product.name }
    });

    return { success: true, order: updateResult.order, product };
  });

  try {
    return transaction();
  } catch (error) {
    console.error('开始试穿失败:', error);
    return { success: false, message: error.message };
  }
};

const completeTryon = (orderId, tryonData, operatorInfo = {}) => {
  const { productId, tryonResult, screenshotId = null } = tryonData;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  if (order.status !== ORDER_STATUSES.TRYON_IN_PROGRESS) {
    return { success: false, message: `订单状态 ${order.status} 不允许完成试穿` };
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) {
    return { success: false, message: '商品不存在' };
  }

  const transaction = db.transaction(() => {
    const detailResult = addOrderDetail(orderId, {
      productId,
      quantity: 1,
      tryonResult,
      tryonScreenshotId: screenshotId
    }, operatorInfo);

    if (!detailResult.success) {
      throw new Error(detailResult.message);
    }

    const updateResult = updateOrderStatus(orderId, ORDER_STATUSES.TRYON_COMPLETED, {
      ...operatorInfo,
      action: 'complete_tryon',
      reason: '试穿完成'
    });

    if (!updateResult.success) {
      throw new Error(updateResult.message);
    }

    if (product.model_3d_id) {
      unlockModel3D(product.model_3d_id, operatorInfo.operatorId);
    }

    if (order.responsible_person) {
      createTodoForResponsiblePerson(orderId, order.responsible_person, ORDER_STATUSES.TRYON_COMPLETED, operatorInfo);
    }

    logAuditEvent(AUDIT_EVENT_TYPES.TRYON_COMPLETED, {
      orderId,
      ...operatorInfo,
      detail: { productId, tryonResult }
    });

    return { success: true, order: updateResult.order, detail: detailResult.detail };
  });

  try {
    return transaction();
  } catch (error) {
    console.error('完成试穿失败:', error);
    return { success: false, message: error.message };
  }
};

const saveScreenshot = (orderId, detailId, imageUrl, tryonParams, operatorInfo = {}) => {
  const screenshotId = generateId('ss');
  
  const stmt = db.prepare(`
    INSERT INTO screenshots (id, order_id, order_detail_id, image_url, taken_by, tryon_params)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    screenshotId,
    orderId,
    detailId,
    imageUrl,
    operatorInfo.operatorId,
    tryonParams ? JSON.stringify(tryonParams) : null
  );

  logAuditEvent(AUDIT_EVENT_TYPES.SCREENSHOT_SAVED, {
    orderId,
    ...operatorInfo,
    detail: { screenshotId, imageUrl }
  });

  const screenshot = db.prepare('SELECT * FROM screenshots WHERE id = ?').get(screenshotId);
  return { success: true, screenshot };
};

const getAvailableProducts = (category = null) => {
  let sql = `
    SELECT p.*, m.file_url as model_3d_url, m.file_type as model_3d_type
    FROM products p
    LEFT JOIN models_3d m ON p.model_3d_id = m.id
    WHERE p.status = 'active'
  `;
  const params = [];

  if (category) {
    sql += ' AND p.category = ?';
    params.push(category);
  }

  return db.prepare(sql).all(...params);
};

module.exports = {
  lockModel3D,
  unlockModel3D,
  startTryon,
  completeTryon,
  saveScreenshot,
  getAvailableProducts
};
