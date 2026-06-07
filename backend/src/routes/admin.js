const express = require('express');
const db = require('../db/init');
const { authenticateToken } = require('./auth');

const router = express.Router();

const adminAuth = (req, res, next) => {
  if (req.user.type !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

router.get('/dashboard', authenticateToken, adminAuth, (req, res) => {
  const todayOrders = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(price), 0) as revenue
    FROM orders 
    WHERE DATE(created_at) = DATE('now')
  `).get();

  const orderStats = db.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
      SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_orders,
      SUM(CASE WHEN status = 'picked' THEN 1 ELSE 0 END) as picked_orders,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
      COALESCE(SUM(price), 0) as total_revenue
    FROM orders
  `).get();

  const driverStats = db.prepare(`
    SELECT 
      COUNT(*) as total_drivers,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_drivers,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_drivers,
      SUM(CASE WHEN online = 1 THEN 1 ELSE 0 END) as online_drivers,
      COALESCE(AVG(service_score), 0) as avg_score
    FROM drivers
  `).get();

  const shipperStats = db.prepare('SELECT COUNT(*) as total_shippers FROM shippers').get();

  const complaintStats = db.prepare(`
    SELECT 
      COUNT(*) as total_complaints,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_complaints
    FROM complaints
  `).get();

  res.json({
    today_orders: todayOrders,
    order_stats: orderStats,
    driver_stats: driverStats,
    shipper_stats: shipperStats,
    complaint_stats: complaintStats
  });
});

router.get('/quality-metrics', authenticateToken, adminAuth, (req, res) => {
  const { start_date, end_date } = req.query;

  const dateFilter = start_date && end_date 
    ? `WHERE DATE(o.created_at) BETWEEN DATE('${start_date}') AND DATE('${end_date}')`
    : '';

  const totalOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders ${dateFilter}
  `).get().count || 1;

  const onTimeOrders = db.prepare(`
    SELECT COUNT(*) as count 
    FROM orders 
    ${dateFilter ? dateFilter.replace('WHERE', 'WHERE status IN ("completed") AND') : 'WHERE status IN ("completed")'}
  `).get().count;

  const complaintCount = db.prepare(`
    SELECT COUNT(*) as count FROM complaints ${dateFilter}
  `).get().count;

  const damageOrders = db.prepare(`
    SELECT COUNT(DISTINCT order_id) as count 
    FROM complaints 
    ${dateFilter ? dateFilter.replace('WHERE', 'WHERE type = "damage" AND') : 'WHERE type = "damage"'}
  `).get().count;

  res.json({
    total_orders: totalOrders,
    on_time_rate: totalOrders > 0 ? Math.round((onTimeOrders / totalOrders) * 10000) / 100 : 0,
    complaint_rate: totalOrders > 0 ? Math.round((complaintCount / totalOrders) * 10000) / 100 : 0,
    damage_rate: totalOrders > 0 ? Math.round((damageOrders / totalOrders) * 10000) / 100 : 0
  });
});

router.get('/capacity-dashboard', authenticateToken, adminAuth, (req, res) => {
  const drivers = db.prepare(`
    SELECT id, name, vehicle_type, lat, lng, online, service_score, order_count
    FROM drivers 
    WHERE status = 'approved'
  `).all();

  const orders = db.prepare(`
    SELECT id, order_no, start_address, end_address, start_lat, start_lng,
           end_lat, end_lng, status, vehicle_type, price
    FROM orders
    WHERE status IN ('pending', 'accepted', 'picked')
    ORDER BY created_at DESC
    LIMIT 50
  `).all();

  res.json({
    drivers,
    active_orders: orders
  });
});

router.get('/audit/orders', authenticateToken, adminAuth, (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;

  const orders = db.prepare(`
    SELECT 
      o.id, o.order_no, o.cargo_type, o.vehicle_type, o.price, o.price_detail,
      o.status, o.created_at,
      s.name as shipper_name, s.phone as shipper_phone,
      d.name as driver_name, d.phone as driver_phone
    FROM orders o
    LEFT JOIN shippers s ON o.shipper_id = s.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(page_size, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM orders').get();

  res.json({
    orders: orders.map(o => ({
      ...o,
      price_detail: o.price_detail ? JSON.parse(o.price_detail) : null
    })),
    total: total.count,
    page: parseInt(page),
    page_size: parseInt(page_size)
  });
});

router.get('/drivers', authenticateToken, adminAuth, (req, res) => {
  const { status } = req.query;
  let drivers;

  if (status) {
    drivers = db.prepare('SELECT * FROM drivers WHERE status = ? ORDER BY created_at DESC').all(status);
  } else {
    drivers = db.prepare('SELECT * FROM drivers ORDER BY created_at DESC').all();
  }

  res.json({ drivers });
});

router.post('/drivers/:id/approve', authenticateToken, adminAuth, (req, res) => {
  db.prepare("UPDATE drivers SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  res.json({ success: true, message: '司机已审核通过' });
});

router.post('/drivers/:id/reject', authenticateToken, adminAuth, (req, res) => {
  db.prepare("UPDATE drivers SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  res.json({ success: true, message: '司机已驳回' });
});

router.get('/complaints', authenticateToken, adminAuth, (req, res) => {
  const { status } = req.query;
  let complaints;

  if (status) {
    complaints = db.prepare(`
      SELECT c.*, o.order_no, o.price
      FROM complaints c
      JOIN orders o ON c.order_id = o.id
      WHERE c.status = ?
      ORDER BY c.created_at DESC
    `).all(status);
  } else {
    complaints = db.prepare(`
      SELECT c.*, o.order_no, o.price
      FROM complaints c
      JOIN orders o ON c.order_id = o.id
      ORDER BY c.created_at DESC
    `).all();
  }

  res.json({ complaints });
});

router.post('/complaints/:id/handle', authenticateToken, adminAuth, (req, res) => {
  const { result } = req.body;
  db.prepare(`
    UPDATE complaints 
    SET status = 'handled', handler_id = ?, result = ?
    WHERE id = ?
  `).run(req.user.id, result, req.params.id);

  res.json({ success: true, message: '投诉已处理' });
});

module.exports = router;
