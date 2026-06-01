const express = require('express');
const router = express.Router();
const db = require('../database');

function generateOrderNo() {
  const date = new Date();
  const prefix = `ORD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const lastOrder = db.prepare('SELECT order_no FROM orders WHERE order_no LIKE ? ORDER BY order_no DESC LIMIT 1').get(`${prefix}%`);
  if (lastOrder) {
    const seq = parseInt(lastOrder.order_no.slice(-4)) + 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }
  return `${prefix}0001`;
}

router.get('/', (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT o.*, c.name as customer_name, d.name as driver_name, v.plate_number
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
  `;
  const params = [];
  if (status) {
    query += ' WHERE o.status = ?';
    params.push(status);
  }
  query += ' ORDER BY o.created_at DESC';
  const orders = db.prepare(query).all(...params);
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, c.name as customer_name, d.name as driver_name, v.plate_number
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    WHERE o.id = ?
  `).get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  const timelines = db.prepare('SELECT * FROM order_timelines WHERE order_id = ? ORDER BY timestamp ASC').all(req.params.id);
  const fees = db.prepare('SELECT * FROM fees WHERE order_id = ? ORDER BY created_at DESC').all(req.params.id);
  const exceptions = db.prepare('SELECT * FROM exceptions WHERE order_id = ? ORDER BY created_at DESC').all(req.params.id);
  
  res.json({ ...order, timelines, fees, exceptions });
});

router.post('/', (req, res) => {
  const { customer_id, container_type, container_count, pickup_location, loading_address, port, cut_off_time, contact_person, contact_phone, special_requirements } = req.body;
  
  const order_no = generateOrderNo();
  
  const existingOrders = db.prepare(`
    SELECT id, order_no, cut_off_time FROM orders 
    WHERE cut_off_time >= ? AND cut_off_time <= ? AND status NOT IN ('completed', 'cancelled')
  `).all(cut_off_time, new Date(new Date(cut_off_time).getTime() + 2 * 60 * 60 * 1000).toISOString());
  
  const result = db.prepare(
    `INSERT INTO orders (order_no, customer_id, container_type, container_count, pickup_location, loading_address, port, cut_off_time, contact_person, contact_phone, special_requirements) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(order_no, customer_id, container_type, container_count, pickup_location, loading_address, port, cut_off_time, contact_person, contact_phone, special_requirements);
  
  res.json({ 
    id: result.lastInsertRowid, 
    order_no, 
    conflict_warning: existingOrders.length > 0 ? `发现 ${existingOrders.length} 个订单时间可能冲突` : null,
    conflicting_orders: existingOrders 
  });
});

router.put('/:id', (req, res) => {
  const { customer_id, container_type, container_count, pickup_location, loading_address, port, cut_off_time, contact_person, contact_phone, special_requirements, status } = req.body;
  db.prepare(
    `UPDATE orders SET customer_id = ?, container_type = ?, container_count = ?, pickup_location = ?, loading_address = ?, port = ?, cut_off_time = ?, contact_person = ?, contact_phone = ?, special_requirements = ?, status = ? WHERE id = ?`
  ).run(customer_id, container_type, container_count, pickup_location, loading_address, port, cut_off_time, contact_person, contact_phone, special_requirements, status, req.params.id);
  res.json({ id: req.params.id });
});

router.post('/:id/dispatch', (req, res) => {
  const { driver_id, vehicle_id } = req.body;
  const orderId = req.params.id;
  
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id);
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  
  if (!driver || driver.status !== 'available') {
    return res.status(400).json({ error: '司机不可用' });
  }
  if (!vehicle || vehicle.status !== 'available') {
    return res.status(400).json({ error: '车辆不可用' });
  }
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (order.container_count > vehicle.capacity) {
    return res.status(400).json({ error: `车辆容量不足，需要${order.container_count}，车辆最大${vehicle.capacity}` });
  }
  
  db.prepare('UPDATE orders SET driver_id = ?, vehicle_id = ?, status = ? WHERE id = ?').run(driver_id, vehicle_id, 'dispatched', orderId);
  db.prepare('UPDATE drivers SET status = ? WHERE id = ?').run('busy', driver_id);
  db.prepare('UPDATE vehicles SET status = ? WHERE id = ?').run('busy', vehicle_id);
  
  db.prepare('INSERT INTO order_timelines (order_id, action, remarks) VALUES (?, ?, ?)').run(orderId, '派单', `司机: ${driver.name}, 车辆: ${vehicle.plate_number}`);
  db.prepare('INSERT INTO dispatch_logs (order_id, action, new_value) VALUES (?, ?, ?)').run(orderId, '派单', JSON.stringify({ driver_id, vehicle_id }));
  
  res.json({ success: true });
});

router.post('/:id/action', (req, res) => {
  const { action, location, remarks } = req.body;
  const orderId = req.params.id;
  
  const validActions = ['arrived', 'picked_up', 'loaded', 'entered_port', 'returned', 'completed'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ error: '无效的操作类型' });
  }
  
  const actionNames = {
    arrived: '到场',
    picked_up: '提柜',
    loaded: '装货',
    entered_port: '进港',
    returned: '还柜',
    completed: '完成'
  };
  
  db.prepare('INSERT INTO order_timelines (order_id, action, location, remarks) VALUES (?, ?, ?, ?)').run(orderId, actionNames[action], location, remarks);
  
  if (action === 'completed') {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('completed', orderId);
    db.prepare('UPDATE drivers SET status = ? WHERE id = ?').run('available', order.driver_id);
    db.prepare('UPDATE vehicles SET status = ? WHERE id = ?').run('available', order.vehicle_id);
  } else if (action === 'entered_port') {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('in_port', orderId);
  }
  
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
