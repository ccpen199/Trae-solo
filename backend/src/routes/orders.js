const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const auditService = require('../services/audit.service');
const escrowPayService = require('../services/escrow-pay.service');
const trustLinkService = require('../services/trust-link.service');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

const generateOrderNo = () => {
  const timestamp = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD${timestamp}${random}`;
};

router.post('/', authenticateToken, (req, res) => {
  const { productId } = req.body;
  const buyerId = req.user.id;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: '请选择要购买的商品'
    });
  }

  const product = db.prepare(`
    SELECT p.*, u.nickname as seller_nickname
    FROM products p
    JOIN users u ON p.seller_id = u.id
    WHERE p.id = ?
  `).get(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: '商品不存在'
    });
  }

  if (product.status !== 'on_sale') {
    return res.status(400).json({
      success: false,
      message: '商品不可购买'
    });
  }

  if (product.seller_id === buyerId) {
    return res.status(400).json({
      success: false,
      message: '不能购买自己发布的商品'
    });
  }

  const existingOrder = db.prepare(`
    SELECT * FROM orders 
    WHERE product_id = ? AND buyer_id = ? 
    AND status NOT IN ('completed', 'cancelled')
  `).get(productId, buyerId);

  if (existingOrder) {
    return res.json({
      success: true,
      message: '您已有进行中的订单',
      data: { orderId: existingOrder.id }
    });
  }

  const orderNo = generateOrderNo();
  const feeInfo = escrowPayService.calculateTotalAmount(product.price);

  const insertStmt = db.prepare(`
    INSERT INTO orders (
      order_no, product_id, seller_id, buyer_id,
      price, service_fee, total_amount, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    orderNo,
    productId,
    product.seller_id,
    buyerId,
    product.price,
    feeInfo.serviceFee,
    feeInfo.total,
    'pending_payment'
  );

  const orderId = result.lastInsertRowid;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  auditService.logCreate({
    user: req.user,
    module: auditService.MODULES.ORDER,
    resourceType: 'order',
    resourceId: orderId,
    newValue: { orderNo, productId, price: product.price },
    description: `创建订单: ${orderNo}`
  });

  res.json({
    success: true,
    data: {
      order,
      product: {
        id: product.id,
        title: product.title,
        images: product.images ? JSON.parse(product.images) : [],
        price: product.price
      },
      feeInfo
    }
  });
});

router.get('/my', authenticateToken, (req, res) => {
  const { role, status, page = 1, limit = 20 } = req.query;
  const userId = req.user.id;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  let whereParams = [];

  if (role === 'seller') {
    whereConditions.push('o.seller_id = ?');
    whereParams.push(userId);
  } else if (role === 'buyer') {
    whereConditions.push('o.buyer_id = ?');
    whereParams.push(userId);
  } else {
    whereConditions.push('(o.seller_id = ? OR o.buyer_id = ?)');
    whereParams.push(userId, userId);
  }

  if (status) {
    whereConditions.push('o.status = ?');
    whereParams.push(status);
  }

  const whereClause = whereConditions.join(' AND ');

  const countSql = `SELECT COUNT(*) as total FROM orders o WHERE ${whereClause}`;
  const countResult = db.prepare(countSql).get(...whereParams);
  const total = countResult.total;

  const sql = `
    SELECT 
      o.*,
      p.title as product_title,
      p.images as product_images,
      p.brand as product_brand,
      seller.nickname as seller_nickname,
      buyer.nickname as buyer_nickname
    FROM orders o
    JOIN products p ON o.product_id = p.id
    LEFT JOIN users seller ON o.seller_id = seller.id
    LEFT JOIN users buyer ON o.buyer_id = buyer.id
    WHERE ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const orders = db.prepare(sql).all(...whereParams, parseInt(limit), offset);

  const formattedOrders = orders.map(o => ({
    ...o,
    productImages: o.product_images ? JSON.parse(o.product_images) : []
  }));

  res.json({
    success: true,
    data: {
      orders: formattedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;

  const order = db.prepare(`
    SELECT 
      o.*,
      p.*,
      seller.nickname as seller_nickname,
      seller.avatar as seller_avatar,
      seller.trust_score as seller_trust_score,
      buyer.nickname as buyer_nickname,
      buyer.avatar as buyer_avatar
    FROM orders o
    JOIN products p ON o.product_id = p.id
    LEFT JOIN users seller ON o.seller_id = seller.id
    LEFT JOIN users buyer ON o.buyer_id = buyer.id
    WHERE o.id = ?
  `).get(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: '订单不存在'
    });
  }

  if (order.seller_id !== userId && order.buyer_id !== userId && 
      req.user.role !== 'admin' && req.user.role !== 'customer_service') {
    return res.status(403).json({
      success: false,
      message: '无权查看此订单'
    });
  }

  const logistics = db.prepare('SELECT * FROM logistics_tracks WHERE order_id = ?').get(orderId);
  const appraisal = db.prepare('SELECT * FROM appraisals WHERE order_id = ?').get(orderId);
  const dispute = db.prepare('SELECT * FROM disputes WHERE order_id = ?').get(orderId);

  const formattedOrder = {
    ...order,
    images: order.images ? JSON.parse(order.images) : [],
    logistics: logistics ? {
      ...logistics,
      events: logistics.events ? JSON.parse(logistics.events) : []
    } : null,
    appraisal: appraisal ? {
      ...appraisal,
      images: appraisal.images ? JSON.parse(appraisal.images) : []
    } : null,
    dispute: dispute ? {
      ...dispute,
      evidence: dispute.evidence ? JSON.parse(dispute.evidence) : []
    } : null
  };

  auditService.logQuery({
    user: req.user,
    module: auditService.MODULES.ORDER,
    resourceType: 'order',
    resourceId: orderId,
    description: `查看订单: ${order.order_no}`
  });

  res.json({
    success: true,
    data: formattedOrder
  });
});

router.post('/:id/pay', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;
  const { paymentMethod = 'alipay' } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: '订单不存在'
    });
  }

  if (order.buyer_id !== userId) {
    return res.status(403).json({
      success: false,
      message: '无权限支付此订单'
    });
  }

  if (order.status !== 'pending_payment') {
    return res.status(400).json({
      success: false,
      message: '订单状态不支持支付'
    });
  }

  db.prepare(`
    UPDATE orders 
    SET status = ?, payment_method = ?, payment_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run('paid', paymentMethod, orderId);

  escrowPayService.lockEscrow(orderId, req.user);

  db.prepare(`
    UPDATE orders 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run('pending_shipment', orderId);

  const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  auditService.logStatusChange({
    user: req.user,
    module: auditService.MODULES.ORDER,
    resourceType: 'order',
    resourceId: orderId,
    oldValue: { status: 'pending_payment' },
    newValue: { status: 'pending_shipment', escrowStatus: 'locked' },
    description: `支付订单: ${order.order_no}, 金额: ${order.total_amount}`
  });

  res.json({
    success: true,
    message: '支付成功，等待卖家发货',
    data: updatedOrder
  });
});

router.post('/:id/ship', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;
  const { shipmentMethod, trackingNumber, carrier } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: '订单不存在'
    });
  }

  if (order.seller_id !== userId) {
    return res.status(403).json({
      success: false,
      message: '无权限操作此订单'
    });
  }

  if (order.status !== 'pending_shipment') {
    return res.status(400).json({
      success: false,
      message: '订单状态不支持发货'
    });
  }

  if (!trackingNumber) {
    return res.status(400).json({
      success: false,
      message: '请提供物流单号'
    });
  }

  db.prepare(`
    UPDATE orders 
    SET status = ?, shipment_method = ?, tracking_number = ?, 
        shipped_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run('shipped', shipmentMethod || 'express', trackingNumber, orderId);

  const initialEvents = [
    {
      time: new Date().toISOString(),
      location: '卖家发货',
      description: '包裹已由卖家发出'
    }
  ];

  db.prepare(`
    INSERT INTO logistics_tracks (
      order_id, tracking_number, carrier, status, current_location, events
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(orderId, trackingNumber, carrier || 'other', 'in_transit', '运输中', JSON.stringify(initialEvents));

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(order.product_id);
  
  if (product && (product.category === '奢侈品' || 
      (product.brand && ['Rolex', 'Omega', 'Cartier', 'Louis Vuitton', 'Gucci', 'Chanel'].includes(product.brand)))) {
    db.prepare(`
      INSERT INTO appraisals (
        order_id, product_id, status, description
      ) VALUES (?, ?, ?, ?)
    `).run(orderId, product.id, 'pending', '该商品为高价值商品，建议进行专业鉴定');
  }

  const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  auditService.logStatusChange({
    user: req.user,
    module: auditService.MODULES.ORDER,
    resourceType: 'order',
    resourceId: orderId,
    oldValue: { status: 'pending_shipment' },
    newValue: { status: 'shipped', trackingNumber },
    description: `订单发货: ${order.order_no}, 物流单号: ${trackingNumber}`
  });

  res.json({
    success: true,
    message: '发货成功',
    data: updatedOrder
  });
});

router.post('/:id/receive', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: '订单不存在'
    });
  }

  if (order.buyer_id !== userId) {
    return res.status(403).json({
      success: false,
      message: '无权限操作此订单'
    });
  }

  if (order.status !== 'shipped') {
    return res.status(400).json({
      success: false,
      message: '订单状态不支持确认收货'
    });
  }

  db.prepare(`
    UPDATE orders 
    SET status = ?, received_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run('pending_confirmation', orderId);

  escrowPayService.releaseEscrow(orderId, req.user);

  db.prepare(`
    UPDATE orders 
    SET status = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run('completed', orderId);

  trustLinkService.onOrderComplete(orderId, req.user);

  const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  auditService.logStatusChange({
    user: req.user,
    module: auditService.MODULES.ORDER,
    resourceType: 'order',
    resourceId: orderId,
    oldValue: { status: 'shipped' },
    newValue: { status: 'completed' },
    description: `确认收货，订单完成: ${order.order_no}`
  });

  res.json({
    success: true,
    message: '确认收货成功，交易完成',
    data: updatedOrder
  });
});

router.post('/:id/cancel', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;
  const { reason } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: '订单不存在'
    });
  }

  if (order.seller_id !== userId && order.buyer_id !== userId) {
    return res.status(403).json({
      success: false,
      message: '无权限操作此订单'
    });
  }

  const allowedStatuses = ['pending_payment', 'paid', 'pending_shipment'];
  if (!allowedStatuses.includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: '当前订单状态无法取消'
    });
  }

  if (order.status === 'paid' || order.status === 'pending_shipment') {
    escrowPayService.refundEscrow(orderId, null, req.user);
  }

  db.prepare(`
    UPDATE orders 
    SET status = ?, cancelled_at = CURRENT_TIMESTAMP, cancel_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run('cancelled', reason || '用户取消订单', orderId);

  const cancellerRole = order.seller_id === userId ? 'seller' : 'buyer';
  trustLinkService.onOrderCancelled(orderId, cancellerRole, req.user);

  const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  auditService.logStatusChange({
    user: req.user,
    module: auditService.MODULES.ORDER,
    resourceType: 'order',
    resourceId: orderId,
    oldValue: { status: order.status },
    newValue: { status: 'cancelled' },
    description: `取消订单: ${order.order_no}, 原因: ${reason || '用户取消'}`
  });

  res.json({
    success: true,
    message: '订单已取消',
    data: updatedOrder
  });
});

router.post('/:id/review', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;
  const { rating, content, images = [], isAnonymous = 0 } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: '订单不存在'
    });
  }

  if (order.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: '只有完成的订单才能评价'
    });
  }

  const isBuyer = order.buyer_id === userId;
  const isSeller = order.seller_id === userId;

  if (!isBuyer && !isSeller) {
    return res.status(403).json({
      success: false,
      message: '无权评价此订单'
    });
  }

  const existingReview = db.prepare(`
    SELECT * FROM reviews WHERE order_id = ? AND reviewer_id = ?
  `).get(orderId, userId);

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: '您已评价过此订单'
    });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: '请提供有效的评分（1-5星）'
    });
  }

  const revieweeId = isBuyer ? order.seller_id : order.buyer_id;

  const insertStmt = db.prepare(`
    INSERT INTO reviews (
      order_id, reviewer_id, reviewee_id, product_id,
      rating, content, images, is_anonymous
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    orderId,
    userId,
    revieweeId,
    order.product_id,
    rating,
    content || null,
    JSON.stringify(images),
    isAnonymous ? 1 : 0
  );

  const reviewId = result.lastInsertRowid;
  trustLinkService.onReviewCreated(reviewId, req.user);

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);

  auditService.logCreate({
    user: req.user,
    module: auditService.MODULES.ORDER,
    resourceType: 'review',
    resourceId: reviewId,
    newValue: { orderId, rating, content },
    description: `订单评价: ${order.order_no}, 评分: ${rating}星`
  });

  res.json({
    success: true,
    message: '评价成功',
    data: {
      ...review,
      images: review.images ? JSON.parse(review.images) : []
    }
  });
});

router.get('/:id/reviews', (req, res) => {
  const orderId = req.params.id;

  const reviews = db.prepare(`
    SELECT 
      r.*,
      reviewer.nickname as reviewer_nickname,
      reviewer.avatar as reviewer_avatar
    FROM reviews r
    LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
    WHERE r.order_id = ?
    ORDER BY r.created_at DESC
  `).all(orderId);

  const formattedReviews = reviews.map(r => ({
    ...r,
    images: r.images ? JSON.parse(r.images) : [],
    isAnonymous: r.is_anonymous === 1
  }));

  res.json({
    success: true,
    data: formattedReviews
  });
});

module.exports = router;
