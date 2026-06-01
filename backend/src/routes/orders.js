const express = require('express');
const db = require('../database');
const router = express.Router();

function generateOrderNo() {
  const date = new Date();
  const prefix = 'OD' + date.getFullYear().toString().slice(-2) + 
    (date.getMonth() + 1).toString().padStart(2, '0') + 
    date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return prefix + random;
}

router.get('/', (req, res) => {
  const { status, vehicle_id, customer_id } = req.query;
  let sql = `
    SELECT o.*, v.plate_number, v.brand, v.model, c.name as customer_name, c.phone,
           ps.name as pickup_store_name, rs.name as return_store_name
    FROM orders o
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN stores ps ON o.pickup_store_id = ps.id
    LEFT JOIN stores rs ON o.return_store_id = rs.id
    WHERE 1=1
  `;
  const params = [];
  if (status) {
    sql += ' AND o.status = ?';
    params.push(status);
  }
  if (vehicle_id) {
    sql += ' AND o.vehicle_id = ?';
    params.push(vehicle_id);
  }
  if (customer_id) {
    sql += ' AND o.customer_id = ?';
    params.push(customer_id);
  }
  sql += ' ORDER BY o.id DESC';
  const orders = db.prepare(sql).all(...params);
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, v.plate_number, v.brand, v.model, v.daily_rate,
           c.name as customer_name, c.phone, c.id_card, c.license_number,
           ps.name as pickup_store_name, rs.name as return_store_name
    FROM orders o
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN stores ps ON o.pickup_store_id = ps.id
    LEFT JOIN stores rs ON o.return_store_id = rs.id
    WHERE o.id = ?
  `).get(req.params.id);
  
  if (!order) return res.status(404).json({ error: '订单不存在' });
  
  const pickupRecord = db.prepare('SELECT * FROM pickup_records WHERE order_id = ?').get(req.params.id);
  const returnRecord = db.prepare('SELECT * FROM return_records WHERE order_id = ?').get(req.params.id);
  const inspection = db.prepare('SELECT * FROM inspections WHERE order_id = ?').get(req.params.id);
  
  order.pickup_record = pickupRecord;
  order.return_record = returnRecord;
  order.inspection = inspection;
  
  res.json(order);
});

router.post('/', (req, res) => {
  const {
    vehicle_id, customer_id, pickup_store_id, return_store_id,
    pickup_date, return_date, deposit, daily_rate, discount,
    additional_services, additional_fee
  } = req.body;
  
  const conflict = db.prepare(`
    SELECT id FROM orders 
    WHERE vehicle_id = ? AND status IN ('confirmed', 'picked_up')
    AND pickup_date < ? AND return_date > ?
  `).get(vehicle_id, return_date, pickup_date);
  
  if (conflict) {
    return res.status(400).json({ error: '该车辆在此时间段已被预订' });
  }
  
  const vehicle = db.prepare('SELECT status FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!vehicle || vehicle.status !== 'available') {
    return res.status(400).json({ error: '该车辆不可租用' });
  }
  
  const pickup = new Date(pickup_date);
  const returnD = new Date(return_date);
  const days = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24));
  const rental_amount = days * daily_rate;
  const total_amount = rental_amount - (discount || 0) + (additional_fee || 0);
  
  const order_no = generateOrderNo();
  
  try {
    const result = db.prepare(`
      INSERT INTO orders (
        order_no, vehicle_id, customer_id, pickup_store_id, return_store_id,
        pickup_date, return_date, deposit, daily_rate, discount,
        additional_services, additional_fee, total_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `).run(
      order_no, vehicle_id, customer_id, pickup_store_id, return_store_id,
      pickup_date, return_date, deposit || 0, daily_rate, discount || 0,
      additional_services ? JSON.stringify(additional_services) : null, additional_fee || 0, total_amount
    );

    const orderId = result.lastInsertRowid;

    if (total_amount > 0) {
      db.prepare(`
        INSERT INTO financial_records (order_id, type, amount, description, payment_method)
        VALUES (?, 'rental', ?, ?, 'pending')
      `).run(orderId, total_amount, `订单${order_no}租金`);
    }

    if (deposit > 0) {
      db.prepare(`
        INSERT INTO financial_records (order_id, type, amount, description, payment_method)
        VALUES (?, 'deposit', ?, ?, 'pending')
      `).run(orderId, deposit, `订单${order_no}押金`);
    }
    
    res.json({ id: orderId, order_no, total_amount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

router.post('/:id/pickup', (req, res) => {
  const orderId = req.params.id;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (order.status !== 'confirmed') return res.status(400).json({ error: '订单状态不正确' });
  
  const { fuel_level, mileage, damages, photos } = req.body;
  
  db.prepare(`
    INSERT INTO pickup_records (order_id, vehicle_id, fuel_level, mileage, damages, photos)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(orderId, order.vehicle_id, fuel_level, mileage, damages || '', photos || '');
  
  db.prepare('UPDATE orders SET status = ?, actual_pickup_date = CURRENT_TIMESTAMP WHERE id = ?').run('picked_up', orderId);
  db.prepare('UPDATE vehicles SET status = ? WHERE id = ?').run('rented', order.vehicle_id);
  
  res.json({ success: true });
});

router.post('/:id/return', (req, res) => {
  const orderId = req.params.id;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (order.status !== 'picked_up') return res.status(400).json({ error: '订单状态不正确' });
  
  const { fuel_level, mileage, new_damages, photos, damage_fee } = req.body;
  
  db.prepare(`
    INSERT INTO return_records (order_id, vehicle_id, fuel_level, mileage, new_damages, photos, damage_fee)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(orderId, order.vehicle_id, fuel_level, mileage, new_damages || '', photos || '', damage_fee || 0);
  
  db.prepare('UPDATE orders SET status = ?, actual_return_date = CURRENT_TIMESTAMP, damage_fee = ? WHERE id = ?').run('returned', damage_fee || 0, orderId);
  db.prepare('UPDATE vehicles SET status = ?, mileage = ? WHERE id = ?').run('available', mileage, order.vehicle_id);
  
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
