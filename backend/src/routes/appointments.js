const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { status, date, search } = req.query;
  let query = `
    SELECT a.*, c.name as customer_name, c.phone, p.name as package_name,
           ts.date, ts.time
    FROM appointments a
    JOIN customers c ON a.customer_id = c.id
    JOIN packages p ON a.package_id = p.id
    JOIN time_slots ts ON a.time_slot_id = ts.id
    WHERE 1=1
  `;
  let params = [];
  
  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  if (date) {
    query += ' AND ts.date = ?';
    params.push(date);
  }
  if (search) {
    query += ' AND (c.phone LIKE ? OR c.name LIKE ? OR a.appointment_no LIKE ? OR p.name LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }
  
  query += ' ORDER BY a.created_at DESC';
  const appointments = db.prepare(query).all(...params);
  res.json(appointments);
});

router.get('/customer/:phone', authenticateToken, (req, res) => {
  const appointments = db.prepare(`
    SELECT a.*, c.name as customer_name, p.name as package_name,
           ts.date, ts.time
    FROM appointments a
    JOIN customers c ON a.customer_id = c.id
    JOIN packages p ON a.package_id = p.id
    JOIN time_slots ts ON a.time_slot_id = ts.id
    WHERE c.phone = ?
    ORDER BY a.created_at DESC
  `).all(req.params.phone);
  res.json(appointments);
});

router.get('/:id', authenticateToken, (req, res) => {
  const appointment = db.prepare(`
    SELECT a.*, c.*, p.name as package_name, p.price,
           ts.date, ts.time
    FROM appointments a
    JOIN customers c ON a.customer_id = c.id
    JOIN packages p ON a.package_id = p.id
    JOIN time_slots ts ON a.time_slot_id = ts.id
    WHERE a.id = ?
  `).get(req.params.id);
  
  if (!appointment) {
    return res.status(404).json({ error: '预约不存在' });
  }
  
  const changes = db.prepare(`
    SELECT ac.*, u.name as operator_name
    FROM appointment_changes ac
    LEFT JOIN users u ON ac.operator_id = u.id
    WHERE ac.appointment_id = ?
    ORDER BY ac.created_at DESC
  `).all(req.params.id);
  
  const records = db.prepare(`
    SELECT cr.*, pi.name as item_name, pi.category, pi.is_key
    FROM checkup_records cr
    JOIN package_items pi ON cr.package_item_id = pi.id
    WHERE cr.appointment_id = ?
    ORDER BY pi.category, pi.id
  `).all(req.params.id);
  
  res.json({ ...appointment, changes, records });
});

router.post('/', authenticateToken, async (req, res) => {
  const { customer_name, customer_phone, customer_id_card, gender, age, address,
          package_id, time_slot_id } = req.body;
  
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ? AND is_published = 1').get(package_id);
  if (!pkg) {
    return res.status(400).json({ error: '套餐不存在或未发布' });
  }
  
  const slot = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(time_slot_id);
  if (!slot || slot.booked >= slot.capacity) {
    return res.status(400).json({ error: '该时间段名额已满' });
  }
  
  let customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(customer_phone);
  if (!customer) {
    const result = db.prepare(`
      INSERT INTO customers (name, phone, id_card, gender, age, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(customer_name, customer_phone, customer_id_card, gender, age, address);
    customer = { id: result.lastInsertRowid };
  }
  
  const appointmentNo = 'A' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  const insertAppointment = db.prepare(`
    INSERT INTO appointments (appointment_no, customer_id, package_id, package_version, time_slot_id, status, payment_status)
    VALUES (?, ?, ?, ?, ?, 'confirmed', 'unpaid')
  `);
  const result = insertAppointment.run(appointmentNo, customer.id, package_id, pkg.version, time_slot_id);
  const appointmentId = result.lastInsertRowid;
  
  db.prepare('UPDATE time_slots SET booked = booked + 1 WHERE id = ?').run(time_slot_id);
  
  const items = db.prepare('SELECT * FROM package_items WHERE package_id = ?').all(package_id);
  const insertRecord = db.prepare(`
    INSERT INTO checkup_records (appointment_id, package_item_id, status)
    VALUES (?, ?, 'pending')
  `);
  for (const item of items) {
    insertRecord.run(appointmentId, item.id);
  }
  
  db.prepare(`
    INSERT INTO appointment_changes (appointment_id, change_type, old_value, new_value, reason)
    VALUES (?, 'status_change', '', 'confirmed', '创建预约')
  `).run(appointmentId);
  
  res.json({ id: appointmentId, appointment_no: appointmentNo, message: '预约成功' });
});

router.post('/:id/pay', authenticateToken, (req, res) => {
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appointment) {
    return res.status(404).json({ error: '预约不存在' });
  }
  if (appointment.payment_status === 'paid') {
    return res.status(400).json({ error: '已支付' });
  }
  
  db.prepare(`
    UPDATE appointments 
    SET payment_status = 'paid', payment_time = CURRENT_TIMESTAMP, payment_amount = (SELECT price FROM packages WHERE id = package_id)
    WHERE id = ?
  `).run(req.params.id);
  
  res.json({ message: '支付成功' });
});

router.post('/:id/checkin', authenticateToken, requireRole('reception', 'admin'), (req, res) => {
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appointment) {
    return res.status(404).json({ error: '预约不存在' });
  }
  if (appointment.payment_status !== 'paid') {
    return res.status(400).json({ error: '请先完成支付' });
  }
  if (appointment.status !== 'confirmed') {
    return res.status(400).json({ error: '预约状态不正确' });
  }
  
  db.prepare(`
    UPDATE appointments 
    SET status = 'checked_in', check_in_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  db.prepare(`
    INSERT INTO appointment_changes (appointment_id, change_type, old_value, new_value, reason)
    VALUES (?, 'status_change', 'confirmed', 'checked_in', '客户签到')
  `).run(req.params.id);
  
  res.json({ message: '签到成功' });
});

router.post('/:id/reschedule', authenticateToken, (req, res) => {
  const { new_time_slot_id, reason } = req.body;
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  
  if (!appointment) {
    return res.status(404).json({ error: '预约不存在' });
  }
  if (appointment.status !== 'confirmed') {
    return res.status(400).json({ error: '只能改期待确认的预约' });
  }
  
  const newSlot = db.prepare('SELECT * FROM time_slots WHERE id = ?').get(new_time_slot_id);
  if (!newSlot || newSlot.booked >= newSlot.capacity) {
    return res.status(400).json({ error: '新时间段名额已满' });
  }
  
  const oldSlotId = appointment.time_slot_id;
  
  db.prepare(`
    UPDATE appointments 
    SET time_slot_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(new_time_slot_id, req.params.id);
  
  db.prepare('UPDATE time_slots SET booked = booked - 1 WHERE id = ?').run(oldSlotId);
  db.prepare('UPDATE time_slots SET booked = booked + 1 WHERE id = ?').run(new_time_slot_id);
  
  db.prepare(`
    INSERT INTO appointment_changes (appointment_id, change_type, old_value, new_value, reason)
    VALUES (?, 'reschedule', ?, ?, ?)
  `).run(req.params.id, oldSlotId, new_time_slot_id, reason || '客户改期');
  
  res.json({ message: '改期成功' });
});

router.post('/:id/cancel', authenticateToken, (req, res) => {
  const { reason } = req.body;
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  
  if (!appointment) {
    return res.status(404).json({ error: '预约不存在' });
  }
  if (!['pending', 'confirmed'].includes(appointment.status)) {
    return res.status(400).json({ error: '该预约无法取消' });
  }
  
  db.prepare(`
    UPDATE appointments 
    SET status = 'cancelled', cancelled_time = CURRENT_TIMESTAMP, cancel_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reason || '客户取消', req.params.id);
  
  db.prepare('UPDATE time_slots SET booked = booked - 1 WHERE id = ?').run(appointment.time_slot_id);
  
  db.prepare(`
    INSERT INTO appointment_changes (appointment_id, change_type, old_value, new_value, reason)
    VALUES (?, 'cancel', ?, 'cancelled', ?)
  `).run(req.params.id, appointment.status, reason || '客户取消');
  
  if (appointment.payment_status === 'paid') {
    db.prepare(`
      UPDATE appointments 
      SET payment_status = 'refunded'
      WHERE id = ?
    `).run(req.params.id);
  }
  
  res.json({ message: '取消成功' });
});

router.post('/:id/noshow', authenticateToken, requireRole('reception', 'admin'), (req, res) => {
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  
  if (!appointment) {
    return res.status(404).json({ error: '预约不存在' });
  }
  if (appointment.status !== 'confirmed') {
    return res.status(400).json({ error: '只能标记已确认的预约为爽约' });
  }
  
  db.prepare(`
    UPDATE appointments 
    SET status = 'no_show', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  db.prepare(`
    INSERT INTO appointment_changes (appointment_id, change_type, old_value, new_value, reason)
    VALUES (?, 'status_change', 'confirmed', 'no_show', '客户爽约')
  `).run(req.params.id);
  
  res.json({ message: '已标记为爽约' });
});

router.post('/:id/refund', authenticateToken, requireRole('admin', 'reception'), (req, res) => {
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  
  if (!appointment) {
    return res.status(404).json({ error: '预约不存在' });
  }
  if (appointment.payment_status !== 'paid') {
    return res.status(400).json({ error: '该预约未支付' });
  }
  
  db.prepare(`
    UPDATE appointments 
    SET payment_status = 'refunded', status = 'refunded', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  db.prepare('UPDATE time_slots SET booked = booked - 1 WHERE id = ?').run(appointment.time_slot_id);
  
  db.prepare(`
    INSERT INTO appointment_changes (appointment_id, change_type, old_value, new_value, reason)
    VALUES (?, 'status_change', ?, 'refunded', '退款处理')
  `).run(req.params.id, appointment.status);
  
  res.json({ message: '退款成功' });
});

module.exports = router;
