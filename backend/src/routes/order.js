const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requirePermission, requireRole, PERMISSIONS, ROLES } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { getDB } = require('../database/init');
const InventoryEngine = require('../engines/InventoryEngine');
const TimelineEngine = require('../engines/TimelineEngine');
const LiveInteractionEngine = require('../engines/LiveInteractionEngine');

const router = express.Router();

router.post('/create', requirePermission(PERMISSIONS.PLACE_ORDER), asyncHandler(async (req, res) => {
  const { productId, quantity = 1, liveStreamId, flashSaleId } = req.body;

  if (!productId) {
    throw new AppError('请选择商品', 400, 'MISSING_PRODUCT');
  }

  if (quantity <= 0) {
    throw new AppError('购买数量必须大于0', 400, 'INVALID_QUANTITY');
  }

  const db = getDB();

  const product = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!product) {
    throw new AppError('商品不存在', 404, 'PRODUCT_NOT_FOUND');
  }

  if (product.status !== 'active') {
    throw new AppError('商品已下架', 400, 'PRODUCT_INACTIVE');
  }

  const unitPrice = product.price;
  const totalAmount = unitPrice * quantity;

  const lockResult = await InventoryEngine.lockStock(productId, quantity, req.user.id, flashSaleId);

  if (!lockResult.success) {
    throw new AppError(lockResult.message || '库存锁定失败', 400, lockResult.code || 'LOCK_FAILED');
  }

  const orderNo = `ORD${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  const orderId = uuidv4();
  const now = Date.now();

  try {
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO orders (
          id, order_no, user_id, product_id, live_stream_id, flash_sale_id,
          quantity, unit_price, total_amount, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId, orderNo, req.user.id, productId, liveStreamId || null, flashSaleId || null,
        quantity, unitPrice, totalAmount, 'pending_payment', now, now
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await TimelineEngine.recordEvent({
      eventType: 'ORDER_CREATE',
      liveStreamId,
      userId: req.user.id,
      productId,
      flashSaleId,
      data: JSON.stringify({
        orderId,
        orderNo,
        quantity,
        totalAmount
      })
    });

    logger.info('订单创建成功', {
      orderId,
      orderNo,
      userId: req.user.id,
      productId,
      quantity,
      totalAmount
    });

    res.status(201).json({
      success: true,
      data: {
        orderId,
        orderNo,
        quantity,
        unitPrice,
        totalAmount,
        status: 'pending_payment',
        expireTime: now + 30 * 60 * 1000
      }
    });

  } catch (error) {
    await InventoryEngine.unlockStock(productId, quantity, req.user.id, flashSaleId, '订单创建失败');
    throw error;
  }
}));

router.post('/:orderId/pay', requirePermission(PERMISSIONS.PLACE_ORDER), asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { paymentMethod = 'alipay' } = req.body;

  const db = getDB();

  const order = await new Promise((resolve, reject) => {
    db.get(`
      SELECT o.*, p.name as product_name, p.merchant_id
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `, [orderId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!order) {
    throw new AppError('订单不存在', 404, 'ORDER_NOT_FOUND');
  }

  if (order.user_id !== req.user.id && req.user.role !== 'platform_admin') {
    throw new AppError('无权限操作此订单', 403, 'FORBIDDEN');
  }

  if (order.status === 'paid') {
    throw new AppError('订单已支付', 400, 'ALREADY_PAID');
  }

  if (order.status !== 'pending_payment') {
    throw new AppError('订单状态不支持支付', 400, 'INVALID_STATUS');
  }

  const now = Date.now();

  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE orders 
      SET status = ?, payment_time = ?, payment_method = ?, updated_at = ? 
      WHERE id = ?
    `, ['paid', now, paymentMethod, now, orderId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await InventoryEngine.deductStock(order.product_id, order.quantity, req.user.id, orderId);

  await TimelineEngine.recordEvent({
    eventType: 'ORDER_PAY',
    liveStreamId: order.live_stream_id,
    userId: req.user.id,
    productId: order.product_id,
    orderId,
    data: JSON.stringify({
      totalAmount: order.total_amount,
      paymentMethod
    })
  });

  if (order.live_stream_id) {
    await LiveInteractionEngine.broadcastOrderUpdate(order.live_stream_id, {
      orderId,
      orderNo: order.order_no,
      status: 'paid',
      productName: order.product_name,
      totalAmount: order.total_amount
    });
  }

  logger.info('订单支付成功', {
    orderId,
    userId: req.user.id,
    totalAmount: order.total_amount
  });

  res.json({
    success: true,
    data: {
      orderId,
      status: 'paid',
      paymentTime: now
    }
  });
}));

router.post('/:orderId/ship', requireRole(ROLES.MERCHANT, ROLES.PLATFORM_ADMIN), requirePermission(PERMISSIONS.PROCESS_ORDER), asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { trackingNumber, shippingAddress } = req.body;

  const db = getDB();

  const order = await new Promise((resolve, reject) => {
    db.get(`
      SELECT o.*, p.merchant_id
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `, [orderId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!order) {
    throw new AppError('订单不存在', 404, 'ORDER_NOT_FOUND');
  }

  if (req.user.role !== 'platform_admin' && order.merchant_id !== req.user.id) {
    throw new AppError('无权限操作此订单', 403, 'FORBIDDEN');
  }

  if (order.status === 'shipped') {
    throw new AppError('订单已发货', 400, 'ALREADY_SHIPPED');
  }

  if (order.status !== 'paid') {
    throw new AppError('订单状态不支持发货', 400, 'INVALID_STATUS');
  }

  const now = Date.now();

  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE orders 
      SET status = ?, tracking_number = ?, shipping_address = ?, shipped_at = ?, updated_at = ? 
      WHERE id = ?
    `, ['shipped', trackingNumber || null, shippingAddress || order.shipping_address, now, now, orderId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await TimelineEngine.recordEvent({
    eventType: 'ORDER_SHIP',
    liveStreamId: order.live_stream_id,
    userId: req.user.id,
    productId: order.product_id,
    orderId,
    data: JSON.stringify({
      trackingNumber,
      shippingAddress
    })
  });

  logger.info('订单发货成功', {
    orderId,
    trackingNumber
  });

  res.json({
    success: true,
    data: {
      orderId,
      status: 'shipped',
      shippedAt: now,
      trackingNumber
    }
  });
}));

router.post('/:orderId/deliver', asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const db = getDB();

  const order = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!order) {
    throw new AppError('订单不存在', 404, 'ORDER_NOT_FOUND');
  }

  if (order.user_id !== req.user.id && req.user.role !== 'platform_admin') {
    throw new AppError('无权限操作此订单', 403, 'FORBIDDEN');
  }

  if (order.status === 'delivered') {
    throw new AppError('订单已确认收货', 400, 'ALREADY_DELIVERED');
  }

  if (order.status !== 'shipped') {
    throw new AppError('订单状态不支持确认收货', 400, 'INVALID_STATUS');
  }

  const now = Date.now();

  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE orders 
      SET status = ?, delivered_at = ?, updated_at = ? 
      WHERE id = ?
    `, ['delivered', now, now, orderId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await TimelineEngine.recordEvent({
    eventType: 'ORDER_DELIVER',
    liveStreamId: order.live_stream_id,
    userId: req.user.id,
    productId: order.product_id,
    orderId,
    data: JSON.stringify({})
  });

  logger.info('订单确认收货成功', { orderId });

  res.json({
    success: true,
    data: {
      orderId,
      status: 'delivered',
      deliveredAt: now
    }
  });
}));

router.post('/:orderId/cancel', asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason = '用户取消' } = req.body;

  const db = getDB();

  const order = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!order) {
    throw new AppError('订单不存在', 404, 'ORDER_NOT_FOUND');
  }

  if (order.user_id !== req.user.id && req.user.role !== 'platform_admin') {
    throw new AppError('无权限操作此订单', 403, 'FORBIDDEN');
  }

  if (order.status === 'cancelled') {
    throw new AppError('订单已取消', 400, 'ALREADY_CANCELLED');
  }

  if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
    throw new AppError('订单已支付，无法取消', 400, 'INVALID_STATUS');
  }

  const now = Date.now();

  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE orders 
      SET status = ?, updated_at = ? 
      WHERE id = ?
    `, ['cancelled', now, orderId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (order.status === 'pending_payment') {
    await InventoryEngine.unlockStock(order.product_id, order.quantity, req.user.id, order.flash_sale_id, reason);
  }

  await TimelineEngine.recordEvent({
    eventType: 'ORDER_CANCEL',
    liveStreamId: order.live_stream_id,
    userId: req.user.id,
    productId: order.product_id,
    orderId,
    data: JSON.stringify({ reason })
  });

  logger.info('订单取消成功', { orderId, reason });

  res.json({
    success: true,
    data: {
      orderId,
      status: 'cancelled'
    }
  });
}));

router.get('/list', asyncHandler(async (req, res) => {
  const { status, limit = 20, offset = 0 } = req.query;
  const db = getDB();

  let query = `
    SELECT 
      o.*,
      p.name as product_name,
      p.image_url as product_image,
      u.nickname as user_nickname
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    LEFT JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'viewer') {
    query += ' AND o.user_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'merchant') {
    query += ' AND p.merchant_id = ?';
    params.push(req.user.id);
  }

  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const orders = await new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.json({
    success: true,
    data: {
      list: orders,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
}));

router.get('/:orderId', asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const db = getDB();

  const order = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        o.*,
        p.name as product_name,
        p.image_url as product_image,
        p.description as product_description,
        u.nickname as user_nickname
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!order) {
    throw new AppError('订单不存在', 404, 'ORDER_NOT_FOUND');
  }

  if (req.user.role === 'viewer' && order.user_id !== req.user.id) {
    throw new AppError('无权限查看此订单', 403, 'FORBIDDEN');
  }

  res.json({
    success: true,
    data: order
  });
}));

module.exports = router;
