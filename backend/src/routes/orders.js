const express = require('express');
const db = require('../database');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

const generateOrderNo = () => {
  const date = new Date();
  const dateStr = date.getFullYear().toString() + 
    (date.getMonth() + 1).toString().padStart(2, '0') + 
    date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString().slice(2, 8);
  return `ORD${dateStr}${random}`;
};

router.get('/', checkPermission('order', 'all'), (req, res) => {
  const { status, customer_name, order_no, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = '1=1';
  const params = [];

  if (status) {
    whereClause += ' AND o.status = ?';
    params.push(status);
  }
  if (customer_name) {
    whereClause += ' AND o.customer_name LIKE ?';
    params.push(`%${customer_name}%`);
  }
  if (order_no) {
    whereClause += ' AND o.order_no LIKE ?';
    params.push(`%${order_no}%`);
  }

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM orders o WHERE ${whereClause}`);
  const { total } = countStmt.get(...params);

  const orders = db.prepare(`
    SELECT o.*, 
           v.plate_number as vehicle_plate, 
           d.real_name as driver_name, d.phone as driver_phone,
           cu.real_name as created_by_name,
           ru.real_name as reviewed_by_name
    FROM orders o
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    LEFT JOIN users cu ON o.created_by = cu.id
    LEFT JOIN users ru ON o.reviewed_by = ru.id
    WHERE ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    data: orders,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.get('/:id', checkPermission('order', 'all'), (req, res) => {
  const order = db.prepare(`
    SELECT o.*, 
           v.plate_number as vehicle_plate, v.vehicle_type,
           d.real_name as driver_name, d.phone as driver_phone,
           cu.real_name as created_by_name,
           ru.real_name as reviewed_by_name
    FROM orders o
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    LEFT JOIN users cu ON o.created_by = cu.id
    LEFT JOIN users ru ON o.reviewed_by = ru.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ message: '订单不存在' });
  }

  const cargo = db.prepare('SELECT * FROM cargo WHERE order_id = ?').all(req.params.id);
  const statusLogs = db.prepare(`
    SELECT l.*, u.real_name as operator_name
    FROM order_status_logs l
    LEFT JOIN users u ON l.operator_id = u.id
    WHERE l.order_id = ?
    ORDER BY l.created_at DESC
  `).all(req.params.id);

  res.json({ ...order, cargo, statusLogs });
});

router.post('/', checkPermission('order', 'all'), (req, res) => {
  const {
    customer_name, customer_phone, origin_address, origin_lat, origin_lng,
    dest_address, dest_lat, dest_lng, order_type, priority, cargo,
    plan_departure_time, plan_arrival_time, total_fee, remark
  } = req.body;

  if (!origin_address || !dest_address) {
    return res.status(400).json({ message: '起始地址和目的地址不能为空' });
  }

  const orderNo = generateOrderNo();

  try {
    const result = db.prepare(`
      INSERT INTO orders (
        order_no, customer_name, customer_phone, origin_address, origin_lat, origin_lng,
        dest_address, dest_lat, dest_lng, order_type, priority,
        plan_departure_time, plan_arrival_time, total_fee, remark, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderNo, customer_name, customer_phone, origin_address, origin_lat, origin_lng,
            dest_address, dest_lat, dest_lng, order_type, priority || 1,
            plan_departure_time, plan_arrival_time, total_fee, remark, req.user.id);

    const orderId = result.lastInsertRowid;

    if (cargo && cargo.length > 0) {
      const insertCargo = db.prepare(`
        INSERT INTO cargo (order_id, cargo_name, cargo_type, weight, volume, quantity, packaging, special_requirements)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      cargo.forEach(item => {
        insertCargo.run(orderId, item.cargo_name, item.cargo_type, item.weight, item.volume, item.quantity, item.packaging, item.special_requirements);
      });
    }

    db.prepare(`
      INSERT INTO order_status_logs (order_id, old_status, new_status, operator_id, remark)
      VALUES (?, ?, ?, ?, ?)
    `).run(orderId, null, 'pending', req.user.id, '订单创建');

    res.json({ message: '订单创建成功', id: orderId, order_no: orderNo });
  } catch (error) {
    res.status(500).json({ message: '创建失败', error: error.message });
  }
});

router.put('/:id', checkPermission('order', 'all'), (req, res) => {
  const {
    customer_name, customer_phone, origin_address, origin_lat, origin_lng,
    dest_address, dest_lat, dest_lng, order_type, priority, cargo,
    plan_departure_time, plan_arrival_time, total_fee, remark
  } = req.body;

  const oldOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!oldOrder) {
    return res.status(404).json({ message: '订单不存在' });
  }

  try {
    db.prepare(`
      UPDATE orders SET 
        customer_name = ?, customer_phone = ?, origin_address = ?, origin_lat = ?, origin_lng = ?,
        dest_address = ?, dest_lat = ?, dest_lng = ?, order_type = ?, priority = ?,
        plan_departure_time = ?, plan_arrival_time = ?, total_fee = ?, remark = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(customer_name, customer_phone, origin_address, origin_lat, origin_lng,
            dest_address, dest_lat, dest_lng, order_type, priority,
            plan_departure_time, plan_arrival_time, total_fee, remark, req.params.id);

    if (cargo && cargo.length > 0) {
      db.prepare('DELETE FROM cargo WHERE order_id = ?').run(req.params.id);
      
      const insertCargo = db.prepare(`
        INSERT INTO cargo (order_id, cargo_name, cargo_type, weight, volume, quantity, packaging, special_requirements)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      cargo.forEach(item => {
        insertCargo.run(req.params.id, item.cargo_name, item.cargo_type, item.weight, item.volume, item.quantity, item.packaging, item.special_requirements);
      });
    }

    res.json({ message: '订单更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

router.put('/:id/review', checkPermission('order', 'dispatch', 'all'), (req, res) => {
  const { review_remark } = req.body;
  const orderId = req.params.id;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({ message: '只有待审核订单才能审核' });
  }

  try {
    db.prepare(`
      UPDATE orders SET 
        status = 'reviewed', 
        reviewed_by = ?, 
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, orderId);

    db.prepare(`
      INSERT INTO order_status_logs (order_id, old_status, new_status, operator_id, remark)
      VALUES (?, ?, ?, ?, ?)
    `).run(orderId, 'pending', 'reviewed', req.user.id, review_remark || '订单审核通过');

    res.json({ message: '订单审核成功' });
  } catch (error) {
    res.status(500).json({ message: '审核失败', error: error.message });
  }
});

router.put('/:id/assign', checkPermission('dispatch', 'all'), (req, res) => {
  const { vehicle_id, driver_id, plan_departure_time, plan_arrival_time } = req.body;
  const orderId = req.params.id;

  if (!vehicle_id || !driver_id) {
    return res.status(400).json({ message: '请选择车辆和司机' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' });
  }

  if (order.status !== 'reviewed' && order.status !== 'planned') {
    return res.status(400).json({ message: '只有已审核或已计划订单才能分配' });
  }

  try {
    db.prepare(`
      UPDATE orders SET 
        vehicle_id = ?, driver_id = ?, status = 'planned',
        plan_departure_time = ?, plan_arrival_time = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(vehicle_id, driver_id, plan_departure_time, plan_arrival_time, orderId);

    db.prepare(`
      INSERT INTO order_status_logs (order_id, old_status, new_status, operator_id, remark)
      VALUES (?, ?, ?, ?, ?)
    `).run(orderId, order.status, 'planned', req.user.id, '订单已分配车辆和司机');

    res.json({ message: '订单分配成功' });
  } catch (error) {
    res.status(500).json({ message: '分配失败', error: error.message });
  }
});

router.put('/:id/start', checkPermission('dispatch', 'driver_task', 'all'), (req, res) => {
  const orderId = req.params.id;
  const { status: targetStatus } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' });
  }

  let newStatus = targetStatus;
  let remark = '';

  if (targetStatus === 'loading' && order.status === 'planned') {
    remark = '开始装货';
  } else if (targetStatus === 'transit' && order.status === 'loading') {
    newStatus = 'transit';
    remark = '开始运输';
    db.prepare(`
      UPDATE orders SET actual_departure_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(orderId);
  } else if (targetStatus === 'unloading' && order.status === 'transit') {
    newStatus = 'unloading';
    remark = '开始卸货';
  } else if (targetStatus === 'completed' && order.status === 'unloading') {
    newStatus = 'completed';
    remark = '订单完成';
    db.prepare(`
      UPDATE orders SET actual_arrival_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(orderId);
  } else {
    return res.status(400).json({ message: '订单状态流转错误' });
  }

  try {
    db.prepare(`
      UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(newStatus, orderId);

    db.prepare(`
      INSERT INTO order_status_logs (order_id, old_status, new_status, operator_id, remark)
      VALUES (?, ?, ?, ?, ?)
    `).run(orderId, order.status, newStatus, req.user.id, remark);

    res.json({ message: remark + '成功', status: newStatus });
  } catch (error) {
    res.status(500).json({ message: '操作失败', error: error.message });
  }
});

router.put('/:id/cancel', checkPermission('order', 'all'), (req, res) => {
  const { cancel_remark } = req.body;
  const orderId = req.params.id;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' });
  }

  if (['transit', 'unloading', 'completed', 'cancelled'].includes(order.status)) {
    return res.status(400).json({ message: '当前状态无法取消订单' });
  }

  try {
    db.prepare(`
      UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(orderId);

    db.prepare(`
      INSERT INTO order_status_logs (order_id, old_status, new_status, operator_id, remark)
      VALUES (?, ?, ?, ?, ?)
    `).run(orderId, order.status, 'cancelled', req.user.id, cancel_remark || '订单取消');

    res.json({ message: '订单取消成功' });
  } catch (error) {
    res.status(500).json({ message: '操作失败', error: error.message });
  }
});

router.delete('/:id', checkPermission('order', 'all'), (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ message: '订单不存在' });
  }

  if (order.status !== 'pending' && order.status !== 'cancelled') {
    return res.status(400).json({ message: '只能删除待审核或已取消的订单' });
  }

  try {
    db.prepare('DELETE FROM cargo WHERE order_id = ?').run(req.params.id);
    db.prepare('DELETE FROM order_status_logs WHERE order_id = ?').run(req.params.id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);

    res.json({ message: '订单删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

router.get('/statistics/summary', checkPermission('order', 'report', 'all'), (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE date(created_at) = date('now')").get();
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get();
  const transitOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'transit'").get();
  const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed' AND date(created_at) = date('now')").get();
  const todayRevenue = db.prepare("SELECT IFNULL(SUM(total_fee), 0) as amount FROM orders WHERE status = 'completed' AND date(actual_arrival_time) = date('now')").get();

  res.json({
    todayOrders: totalOrders.count,
    pendingOrders: pendingOrders.count,
    transitOrders: transitOrders.count,
    todayCompleted: completedOrders.count,
    todayRevenue: todayRevenue.amount
  });
});

module.exports = router;
