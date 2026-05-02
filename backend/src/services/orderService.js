const db = require('../database');
const { generateOrderNo, generateId } = require('../utils/orderGenerator');
const { logAuditEvent, AUDIT_EVENT_TYPES } = require('./auditService');
const { ORDER_STATUSES, updateOrderStatus, getStatusTimeline } = require('./orderStatusService');
const { createTodoForResponsiblePerson } = require('./todoService');

const createOrder = (data, operatorInfo = {}) => {
  const {
    consumerId,
    consumerName,
    cameraInfo = null,
    cameraAttachments = null,
    responsiblePerson = null,
    expectedTime = null,
    storeId = null,
    brandId = null,
    memberLevel = 'normal'
  } = data;

  if (!consumerId) {
    return { success: false, message: '消费者ID为必填项' };
  }

  const consumer = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(consumerId, 'consumer');
  if (!consumer) {
    return { success: false, message: '消费者不存在或角色不正确' };
  }

  const orderNo = generateOrderNo();
  const orderId = generateId('order');

  const transaction = db.transaction(() => {
    const orderStmt = db.prepare(`
      INSERT INTO orders (
        id, order_no, consumer_id, consumer_name, status,
        camera_info, camera_attachments, responsible_person,
        expected_time, store_id, brand_id, member_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    orderStmt.run(
      orderId,
      orderNo,
      consumerId,
      consumerName || consumer.name,
      ORDER_STATUSES.DRAFT,
      cameraInfo ? JSON.stringify(cameraInfo) : null,
      cameraAttachments ? JSON.stringify(cameraAttachments) : null,
      responsiblePerson,
      expectedTime,
      storeId,
      brandId,
      memberLevel
    );

    logAuditEvent(AUDIT_EVENT_TYPES.ORDER_CREATED, {
      orderId,
      ...operatorInfo,
      detail: { orderNo, consumerId }
    });

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    return { success: true, order };
  });

  try {
    return transaction();
  } catch (error) {
    console.error('创建订单失败:', error);
    return { success: false, message: error.message };
  }
};

const openCamera = (orderId, data, operatorInfo = {}) => {
  const {
    cameraInfo,
    cameraAttachments,
    responsiblePerson,
    expectedTime
  } = data;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  const existingOrder = db.prepare(`
    SELECT id FROM orders 
    WHERE consumer_id = ? AND status IN (?, ?, ?, ?, ?, ?) AND id != ?
  `).get(
    order.consumer_id,
    ORDER_STATUSES.DRAFT,
    ORDER_STATUSES.CAMERA_OPENED,
    ORDER_STATUSES.PENDING_RECOGNITION,
    ORDER_STATUSES.RECOGNITION_IN_PROGRESS,
    ORDER_STATUSES.RECOGNITION_COMPLETED,
    ORDER_STATUSES.PENDING_TRYON,
    orderId
  );

  if (existingOrder) {
    return { success: false, message: '存在进行中的订单，请先完成或取消' };
  }

  const transaction = db.transaction(() => {
    const updateStmt = db.prepare(`
      UPDATE orders 
      SET camera_info = ?, camera_attachments = ?, responsible_person = ?, expected_time = ?
      WHERE id = ?
    `);

    updateStmt.run(
      cameraInfo ? JSON.stringify(cameraInfo) : null,
      cameraAttachments ? JSON.stringify(cameraAttachments) : null,
      responsiblePerson,
      expectedTime,
      orderId
    );

    const result = updateOrderStatus(orderId, ORDER_STATUSES.CAMERA_OPENED, {
      ...operatorInfo,
      action: 'open_camera',
      reason: '消费者打开摄像头'
    });

    if (!result.success) {
      throw new Error(result.message);
    }

    if (responsiblePerson) {
      createTodoForResponsiblePerson(orderId, responsiblePerson, ORDER_STATUSES.CAMERA_OPENED, operatorInfo);
    }

    logAuditEvent(AUDIT_EVENT_TYPES.ORDER_STATUS_CHANGED, {
      orderId,
      ...operatorInfo,
      detail: { action: 'open_camera', cameraInfo }
    });

    return { success: true, order: result.order };
  });

  try {
    return transaction();
  } catch (error) {
    console.error('打开摄像头失败:', error);
    return { success: false, message: error.message };
  }
};

const addOrderDetail = (orderId, detailData, operatorInfo = {}) => {
  const { productId, quantity = 1, tryonResult = null, tryonScreenshotId = null } = detailData;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) {
    return { success: false, message: '商品不存在' };
  }

  const detailId = generateId('detail');
  const subtotal = product.price * quantity;

  const stmt = db.prepare(`
    INSERT INTO order_details (
      id, order_id, product_id, product_name, sku,
      quantity, unit_price, subtotal, tryon_result, tryon_screenshot_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    detailId,
    orderId,
    productId,
    product.name,
    product.sku,
    quantity,
    product.price,
    subtotal,
    tryonResult ? JSON.stringify(tryonResult) : null,
    tryonScreenshotId
  );

  const details = db.prepare('SELECT * FROM order_details WHERE order_id = ?').all(orderId);
  const totalAmount = details.reduce((sum, d) => sum + (d.subtotal || 0), 0);
  
  db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(totalAmount, orderId);

  logAuditEvent(AUDIT_EVENT_TYPES.PRODUCT_ADDED, {
    orderId,
    ...operatorInfo,
    detail: { detailId, productId, productName: product.name }
  });

  const detail = db.prepare('SELECT * FROM order_details WHERE id = ?').get(detailId);
  return { success: true, detail };
};

const getOrderById = (orderId) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return null;
  }

  const details = db.prepare('SELECT * FROM order_details WHERE order_id = ?').all(orderId);
  const timeline = getStatusTimeline(orderId);

  return {
    ...order,
    details,
    timeline
  };
};

const getOrdersByConsumer = (consumerId, options = {}) => {
  const { status = null, limit = 50, offset = 0 } = options;
  
  let sql = 'SELECT * FROM orders WHERE consumer_id = ?';
  const params = [consumerId];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  return db.prepare(sql).all(...params);
};

const getOrdersByResponsible = (responsiblePersonId, options = {}) => {
  const { status = null, limit = 50, offset = 0 } = options;
  
  let sql = 'SELECT * FROM orders WHERE responsible_person = ?';
  const params = [responsiblePersonId];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  return db.prepare(sql).all(...params);
};

const cancelOrder = (orderId, operatorInfo = {}) => {
  return updateOrderStatus(orderId, ORDER_STATUSES.CANCELLED, {
    ...operatorInfo,
    action: 'cancel',
    reason: '订单被取消'
  });
};

module.exports = {
  createOrder,
  openCamera,
  addOrderDetail,
  getOrderById,
  getOrdersByConsumer,
  getOrdersByResponsible,
  cancelOrder
};
