import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { date, store_id, status, customer_id } = req.query;
  let sql = `
    SELECT a.*, c.name as customer_name, c.phone as customer_phone,
           s.name as service_name, st.name as staff_name, sto.name as store_name
    FROM appointments a
    JOIN customers c ON a.customer_id = c.id
    JOIN services s ON a.service_id = s.id
    LEFT JOIN staff st ON a.staff_id = st.id
    LEFT JOIN stores sto ON a.store_id = sto.id
    WHERE 1=1
  `;
  const params = [];
  
  if (date) { sql += ' AND a.appointment_date = ?'; params.push(date); }
  if (store_id) { sql += ' AND a.store_id = ?'; params.push(store_id); }
  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  if (customer_id) { sql += ' AND a.customer_id = ?'; params.push(customer_id); }
  
  sql += ' ORDER BY a.appointment_date DESC, a.start_time DESC';
  
  const appointments = db.prepare(sql).all(...params);
  res.json(appointments);
});

router.get('/:id', (req, res) => {
  const appointment = db.prepare(`
    SELECT a.*, c.name as customer_name, c.phone as customer_phone,
           s.name as service_name, s.duration as service_duration,
           s.preparation as service_preparation, s.cancellation_rule as cancellation_rule,
           st.name as staff_name, sto.name as store_name, sto.address as store_address
    FROM appointments a
    JOIN customers c ON a.customer_id = c.id
    JOIN services s ON a.service_id = s.id
    LEFT JOIN staff st ON a.staff_id = st.id
    LEFT JOIN stores sto ON a.store_id = sto.id
    WHERE a.id = ?
  `).get(req.params.id);
  
  if (!appointment) return res.status(404).json({ error: '预约不存在' });
  
  const serviceRecord = db.prepare('SELECT * FROM service_records WHERE appointment_id = ?').get(req.params.id);
  const review = db.prepare('SELECT * FROM reviews WHERE appointment_id = ?').get(req.params.id);
  const reminders = db.prepare('SELECT * FROM reminders WHERE appointment_id = ? ORDER BY created_at').all(req.params.id);
  
  res.json({ ...appointment, serviceRecord, review, reminders });
});

router.post('/', (req, res) => {
  const { customer_name, customer_phone, service_id, store_id, staff_id, appointment_date, start_time, end_time, notes } = req.body;
  
  const conflict = db.prepare(`
    SELECT COUNT(*) as count FROM appointments
    WHERE staff_id = ? AND appointment_date = ? AND status NOT IN ('cancelled', 'no_show')
    AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))
  `).get(staff_id, appointment_date, end_time, start_time, end_time, start_time);
  
  if (conflict.count > 0) {
    return res.status(400).json({ error: '该时段已被预约，请选择其他时间' });
  }
  
  let customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(customer_phone);
  if (!customer) {
    const result = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run(customer_name, customer_phone);
    customer = { id: result.lastInsertRowid };
  }
  
  const service = db.prepare('SELECT price FROM services WHERE id = ?').get(service_id);
  
  const result = db.prepare(`
    INSERT INTO appointments (customer_id, service_id, store_id, staff_id, appointment_date, start_time, end_time, notes, total_price, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
  `).run(customer.id, service_id, store_id, staff_id, appointment_date, start_time, end_time, notes, service?.price || 0);
  
  db.prepare('INSERT INTO reminders (appointment_id, type) VALUES (?, ?)').run(result.lastInsertRowid, 'booking');
  
  res.json({ id: result.lastInsertRowid, status: 'confirmed' });
});

router.put('/:id/checkin', (req, res) => {
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appointment) return res.status(404).json({ error: '预约不存在' });
  
  const [apptHour, apptMin] = appointment.start_time.split(':').map(Number);
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const apptMinTotal = apptHour * 60 + apptMin;
  const isLate = currentMin > apptMinTotal + 15;
  
  db.prepare(`
    UPDATE appointments 
    SET status = ?, arrived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(isLate ? 'late' : 'checked_in', req.params.id);
  
  res.json({ success: true, status: isLate ? 'late' : 'checked_in' });
});

router.put('/:id/start-service', (req, res) => {
  db.prepare(`
    UPDATE appointments SET status = 'in_service', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);
  res.json({ success: true });
});

router.put('/:id/complete', (req, res) => {
  const { content, materials, photos, additional_services, additional_price } = req.body;
  
  db.prepare(`
    UPDATE appointments 
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP,
        total_price = total_price + ?
    WHERE id = ?
  `).run(additional_price || 0, req.params.id);
  
  db.prepare(`
    INSERT INTO service_records (appointment_id, content, materials, photos, additional_services, additional_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, content, materials, photos, additional_services, additional_price || 0);
  
  res.json({ success: true });
});

router.put('/:id/reschedule', (req, res) => {
  const { appointment_date, start_time, end_time, staff_id } = req.body;
  
  const conflict = db.prepare(`
    SELECT COUNT(*) as count FROM appointments
    WHERE staff_id = ? AND appointment_date = ? AND id != ? AND status NOT IN ('cancelled', 'no_show')
    AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))
  `).get(staff_id, appointment_date, req.params.id, end_time, start_time, end_time, start_time);
  
  if (conflict.count > 0) {
    return res.status(400).json({ error: '该时段已被预约，请选择其他时间' });
  }
  
  db.prepare(`
    UPDATE appointments 
    SET appointment_date = ?, start_time = ?, end_time = ?, staff_id = ?, status = 'rescheduled', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(appointment_date, start_time, end_time, staff_id, req.params.id);
  
  db.prepare('INSERT INTO reminders (appointment_id, type) VALUES (?, ?)').run(req.params.id, 'reschedule');
  
  res.json({ success: true });
});

router.put('/:id/cancel', (req, res) => {
  const { reason } = req.body;
  db.prepare(`
    UPDATE appointments 
    SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancel_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reason, req.params.id);
  
  db.prepare('INSERT INTO reminders (appointment_id, type) VALUES (?, ?)').run(req.params.id, 'cancel');
  
  res.json({ success: true });
});

router.put('/:id/no-show', (req, res) => {
  db.prepare(`
    UPDATE appointments SET status = 'no_show', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/review', (req, res) => {
  const { rating, comment } = req.body;
  const result = db.prepare(`
    INSERT INTO reviews (appointment_id, rating, comment) VALUES (?, ?, ?)
  `).run(req.params.id, rating, comment);
  res.json({ id: result.lastInsertRowid });
});

export default router;
