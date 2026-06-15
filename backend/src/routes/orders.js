const express = require('express');
const router = express.Router();
const db = require('../db/database');
const dayjs = require('dayjs');
const { getOptimalPlatform, getCheapestPlatform, calculatePlatformFee, calculateDeliveryTime } = require('../services/routingService');

function generateOrderNo() {
  const now = dayjs();
  const prefix = 'DD';
  const dateStr = now.format('YYYYMMDD');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}

function generatePlatformOrderNo(platformCode) {
  const now = dayjs();
  const prefix = platformCode.toUpperCase().substring(0, 4);
  const dateStr = now.format('YYYYMMDD');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}${dateStr}${random}`;
}

router.get('/', (req, res) => {
  const { merchant_id, status, delivery_status, platform_id, page = 1, pageSize = 20 } = req.query;
  
  let query = 'SELECT o.*, p.name as platform_name, p.logo as platform_logo, m.name as merchant_name FROM orders o';
  query += ' LEFT JOIN platforms p ON o.platform_id = p.id';
  query += ' LEFT JOIN merchants m ON o.merchant_id = m.id';
  
  const where = [];
  const params = [];
  
  if (merchant_id) {
    where.push('o.merchant_id = ?');
    params.push(merchant_id);
  }
  if (status) {
    where.push('o.status = ?');
    params.push(status);
  }
  if (delivery_status) {
    where.push('o.delivery_status = ?');
    params.push(delivery_status);
  }
  if (platform_id) {
    where.push('o.platform_id = ?');
    params.push(platform_id);
  }
  
  if (where.length > 0) {
    query += ' WHERE ' + where.join(' AND ');
  }
  
  query += ' ORDER BY o.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize));
  params.push((parseInt(page) - 1) * parseInt(pageSize));
  
  const orders = db.prepare(query).all(...params);
  
  let countQuery = 'SELECT COUNT(*) as total FROM orders o';
  if (where.length > 0) {
    countQuery += ' WHERE ' + where.join(' AND ');
  }
  const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));
  
  res.json({ success: true, data: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/stats', (req, res) => {
  const { merchant_id, platform_id } = req.query;
  
  let where = [];
  let params = [];
  
  if (merchant_id) {
    where.push('merchant_id = ?');
    params.push(merchant_id);
  }
  if (platform_id) {
    where.push('platform_id = ?');
    params.push(platform_id);
  }
  
  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'assigned' AND delivery_status IN ('pending', 'picked', 'delivering') THEN 1 ELSE 0 END) as delivering_count,
      SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered_count,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
      SUM(CASE WHEN status = 'exception' THEN 1 ELSE 0 END) as exception_count,
      SUM(CASE WHEN delivery_status = 'delivered' THEN total_fee ELSE 0 END) as total_revenue,
      AVG(CASE WHEN delivery_status = 'delivered' AND picked_up_at IS NOT NULL AND delivered_at IS NOT NULL 
        THEN (julianday(delivered_at) - julianday(picked_up_at)) * 24 * 60 ELSE NULL END) as avg_delivery_time
    FROM orders
    ${whereClause}
  `).get(...params);
  
  res.json({ success: true, data: stats });
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, p.name as platform_name, p.logo as platform_logo, p.code as platform_code,
           m.name as merchant_name, m.contact_phone as merchant_phone
    FROM orders o
    LEFT JOIN platforms p ON o.platform_id = p.id
    LEFT JOIN merchants m ON o.merchant_id = m.id
    WHERE o.id = ?
  `).get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }
  
  const tracks = db.prepare('SELECT * FROM order_tracks WHERE order_id = ? ORDER BY id').all(req.params.id);
  
  res.json({ success: true, data: { ...order, tracks } });
});

router.get('/:id/tracks', (req, res) => {
  const tracks = db.prepare('SELECT * FROM order_tracks WHERE order_id = ? ORDER BY id DESC').all(req.params.id);
  res.json({ success: true, data: tracks });
});

router.post('/quote', (req, res) => {
  const { distance, weight, urgency, expected_time, merchant_id } = req.body;
  
  if (!distance || distance <= 0) {
    return res.status(400).json({ success: false, message: '请输入有效的配送距离' });
  }
  
  const optimal = getOptimalPlatform(distance, weight || 0, urgency || 'normal', expected_time);
  const cheapest = getCheapestPlatform(distance, weight || 0);
  
  res.json({
    success: true,
    data: {
      optimal: optimal.map(r => ({
        platform: r.platform,
        score: r.score,
        fee: r.fee,
        delivery_time: r.deliveryTime,
        meets_deadline: r.meetsDeadline
      })),
      cheapest: cheapest.map(r => ({
        platform: r.platform,
        fee: r.fee,
        delivery_time: r.deliveryTime
      })),
      recommendation: optimal[0] ? {
        platform: optimal[0].platform,
        reason: optimal[0].meetsDeadline ? '综合评分最高且满足时效要求' : '综合评分最高',
        fee: optimal[0].fee,
        delivery_time: optimal[0].deliveryTime
      } : null
    }
  });
});

router.post('/', (req, res) => {
  const {
    merchant_id, sender_name, sender_phone, sender_address, sender_lat, sender_lng,
    receiver_name, receiver_phone, receiver_address, receiver_lat, receiver_lng,
    goods_name, goods_weight, goods_value, distance, expected_delivery_time,
    urgency, platform_id, auto_route = true
  } = req.body;
  
  if (!merchant_id || !receiver_name || !receiver_phone || !receiver_address) {
    return res.status(400).json({ success: false, message: '缺少必要的收件人信息' });
  }
  
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(merchant_id);
  if (!merchant) {
    return res.status(400).json({ success: false, message: '商户不存在' });
  }
  
  const orderNo = generateOrderNo();
  const actualDistance = distance || 5;
  const actualWeight = goods_weight || 0;
  
  let selectedPlatformId = platform_id;
  let platformFee = 0;
  let deliveryTime = 60;
  
  if (auto_route || !platform_id) {
    const optimal = getOptimalPlatform(actualDistance, actualWeight, urgency || 'normal', expected_delivery_time);
    if (optimal.length > 0) {
      selectedPlatformId = optimal[0].platform.id;
      platformFee = optimal[0].fee;
      deliveryTime = optimal[0].deliveryTime;
    }
  } else {
    const platform = db.prepare('SELECT * FROM platforms WHERE id = ?').get(platform_id);
    if (platform) {
      platformFee = calculatePlatformFee(platform, actualDistance, actualWeight);
      deliveryTime = calculateDeliveryTime(platform, actualDistance);
    }
  }
  
  const platform = selectedPlatformId ? db.prepare('SELECT * FROM platforms WHERE id = ?').get(selectedPlatformId) : null;
  const platformOrderNo = platform ? generatePlatformOrderNo(platform.code) : null;
  const commissionRate = platform ? platform.commission_rate : 0.05;
  const totalFee = parseFloat(platformFee.toFixed(2));
  const merchantFee = parseFloat((platformFee * (1 + commissionRate)).toFixed(2));
  
  const estimatedArrival = dayjs().add(deliveryTime, 'minute').format('YYYY-MM-DD HH:mm:ss');
  
  const result = db.prepare(`
    INSERT INTO orders (order_no, merchant_id, sender_name, sender_phone, sender_address,
      sender_lat, sender_lng, receiver_name, receiver_phone, receiver_address,
      receiver_lat, receiver_lng, goods_name, goods_weight, goods_value, distance,
      expected_delivery_time, urgency, total_fee, platform_fee, platform_id,
      platform_order_no, status, delivery_status, estimated_arrival_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(orderNo, merchant_id, sender_name || merchant.contact_name, sender_phone || merchant.contact_phone,
         sender_address || merchant.address, sender_lat || merchant.latitude, sender_lng || merchant.longitude,
         receiver_name, receiver_phone, receiver_address, receiver_lat, receiver_lng,
         goods_name || '', actualWeight, goods_value || 0, actualDistance,
         expected_delivery_time || deliveryTime, urgency || 'normal',
         merchantFee, platformFee, selectedPlatformId, platformOrderNo,
         selectedPlatformId ? 'assigned' : 'pending', 'pending', estimatedArrival);
  
  const orderId = result.lastInsertRowid;
  
  db.prepare(`INSERT INTO order_tracks (order_id, status, description, location) VALUES (?, ?, ?, ?)`)
    .run(orderId, 'pending', '订单已创建', sender_address || merchant.address);
  
  if (selectedPlatformId) {
    db.prepare(`INSERT INTO order_tracks (order_id, status, description, location) VALUES (?, ?, ?, ?)`)
      .run(orderId, 'assigned', `已分配${platform.name}`, sender_address || merchant.address);
  }
  
  const order = db.prepare(`
    SELECT o.*, p.name as platform_name, p.logo as platform_logo, m.name as merchant_name
    FROM orders o
    LEFT JOIN platforms p ON o.platform_id = p.id
    LEFT JOIN merchants m ON o.merchant_id = m.id
    WHERE o.id = ?
  `).get(orderId);
  
  res.json({ success: true, data: order });
});

router.put('/:id/status', (req, res) => {
  const { status, delivery_status, rider_name, rider_phone } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }
  
  const updates = [];
  const values = [];
  
  if (status) {
    updates.push('status = ?');
    values.push(status);
  }
  if (delivery_status) {
    updates.push('delivery_status = ?');
    values.push(delivery_status);
  }
  if (rider_name) {
    updates.push('rider_name = ?');
    values.push(rider_name);
  }
  if (rider_phone) {
    updates.push('rider_phone = ?');
    values.push(rider_phone);
  }
  
  if (delivery_status === 'picked') {
    updates.push('picked_up_at = ?');
    values.push(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  }
  if (delivery_status === 'delivered') {
    updates.push('delivered_at = ?');
    values.push(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  }
  
  updates.push('updated_at = ?');
  values.push(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  values.push(req.params.id);
  
  db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  
  const statusDescriptions = {
    pending: '订单待分配',
    assigned: '订单已分配',
    picked: '骑手已取货',
    delivering: '配送中',
    delivered: '已送达',
    cancelled: '订单已取消',
    exception: '订单异常'
  };
  
  const trackStatus = delivery_status || status;
  if (trackStatus && statusDescriptions[trackStatus]) {
    db.prepare(`INSERT INTO order_tracks (order_id, status, description) VALUES (?, ?, ?)`)
      .run(req.params.id, trackStatus, statusDescriptions[trackStatus]);
  }
  
  const updatedOrder = db.prepare(`
    SELECT o.*, p.name as platform_name, p.logo as platform_logo
    FROM orders o
    LEFT JOIN platforms p ON o.platform_id = p.id
    WHERE o.id = ?
  `).get(req.params.id);
  
  res.json({ success: true, data: updatedOrder });
});

router.post('/:id/cancel', (req, res) => {
  const { reason } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }
  
  if (order.delivery_status === 'delivered' || order.delivery_status === 'delivering') {
    return res.status(400).json({ success: false, message: '订单已开始配送，无法取消' });
  }
  
  db.prepare(`UPDATE orders SET status = 'cancelled', cancel_reason = ?, updated_at = ? WHERE id = ?`)
    .run(reason || '', dayjs().format('YYYY-MM-DD HH:mm:ss'), req.params.id);
  
  db.prepare(`INSERT INTO order_tracks (order_id, status, description) VALUES (?, ?, ?)`)
    .run(req.params.id, 'cancelled', reason ? `订单已取消：${reason}` : '订单已取消');
  
  res.json({ success: true, message: '订单已取消' });
});

module.exports = router;
