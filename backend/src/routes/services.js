import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const services = db.prepare('SELECT * FROM services ORDER BY id').all();
  res.json(services);
});

router.get('/:id', (req, res) => {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!service) return res.status(404).json({ error: '服务不存在' });
  
  const stores = db.prepare(`
    SELECT s.* FROM stores s 
    JOIN service_stores ss ON s.id = ss.store_id 
    WHERE ss.service_id = ?
  `).all(req.params.id);
  
  const staff = db.prepare(`
    SELECT st.* FROM staff st 
    JOIN service_staff ss ON st.id = ss.staff_id 
    WHERE ss.service_id = ?
  `).all(req.params.id);
  
  res.json({ ...service, stores, staff });
});

router.get('/:id/availability', (req, res) => {
  const { date, store_id } = req.query;
  const serviceId = req.params.id;
  
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
  if (!service) return res.status(404).json({ error: '服务不存在' });
  
  const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(store_id || 1);
  if (!store) return res.status(404).json({ error: '门店不存在' });
  
  const availableStaff = db.prepare(`
    SELECT st.* FROM staff st 
    JOIN service_staff ss ON st.id = ss.staff_id 
    WHERE ss.service_id = ? AND st.store_id = ? AND st.role = 'technician'
  `).all(serviceId, store_id || 1);
  
  const appointments = db.prepare(`
    SELECT a.* FROM appointments a
    WHERE a.service_id = ? AND a.appointment_date = ? 
    AND a.store_id = ? AND a.status NOT IN ('cancelled', 'no_show')
  `).all(serviceId, date, store_id || 1);
  
  const timeSlots = generateTimeSlots(store.opening_time, store.closing_time, service.duration);
  
  const slotsWithAvailability = timeSlots.map(slot => {
    const busyStaff = appointments
      .filter(a => isTimeOverlap(slot.start, slot.end, a.start_time, a.end_time))
      .map(a => a.staff_id);
    
    const freeStaff = availableStaff.filter(s => !busyStaff.includes(s.id));
    
    return {
      start: slot.start,
      end: slot.end,
      available: freeStaff.length > 0,
      available_staff: freeStaff,
      capacity_used: busyStaff.length,
      capacity_total: availableStaff.length
    };
  });
  
  res.json({
    service,
    store,
    date,
    slots: slotsWithAvailability
  });
});

router.post('/', (req, res) => {
  const { name, duration, price, description, preparation, cancellation_rule, store_ids, staff_ids } = req.body;
  
  const result = db.prepare(
    'INSERT INTO services (name, duration, price, description, preparation, cancellation_rule) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, duration, price, description, preparation, cancellation_rule);
  
  const serviceId = result.lastInsertRowid;
  
  if (store_ids && store_ids.length) {
    const insertStore = db.prepare('INSERT INTO service_stores (service_id, store_id) VALUES (?, ?)');
    store_ids.forEach(storeId => insertStore.run(serviceId, storeId));
  }
  
  if (staff_ids && staff_ids.length) {
    const insertStaff = db.prepare('INSERT INTO service_staff (service_id, staff_id) VALUES (?, ?)');
    staff_ids.forEach(staffId => insertStaff.run(serviceId, staffId));
  }
  
  res.json({ id: serviceId, ...req.body });
});

router.put('/:id', (req, res) => {
  const { name, duration, price, description, preparation, cancellation_rule, store_ids, staff_ids } = req.body;
  
  db.prepare(
    'UPDATE services SET name = ?, duration = ?, price = ?, description = ?, preparation = ?, cancellation_rule = ? WHERE id = ?'
  ).run(name, duration, price, description, preparation, cancellation_rule, req.params.id);
  
  db.prepare('DELETE FROM service_stores WHERE service_id = ?').run(req.params.id);
  db.prepare('DELETE FROM service_staff WHERE service_id = ?').run(req.params.id);
  
  if (store_ids && store_ids.length) {
    const insertStore = db.prepare('INSERT INTO service_stores (service_id, store_id) VALUES (?, ?)');
    store_ids.forEach(storeId => insertStore.run(req.params.id, storeId));
  }
  
  if (staff_ids && staff_ids.length) {
    const insertStaff = db.prepare('INSERT INTO service_staff (service_id, staff_id) VALUES (?, ?)');
    staff_ids.forEach(staffId => insertStaff.run(req.params.id, staffId));
  }
  
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/:id', (req, res) => {
  try {
    const apptCount = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE service_id = ?').get(req.params.id).count;
    if (apptCount > 0) {
      return res.status(400).json({ error: '该服务已有预约记录，无法删除。请先处理相关预约。' });
    }
    db.prepare('DELETE FROM service_stores WHERE service_id = ?').run(req.params.id);
    db.prepare('DELETE FROM service_staff WHERE service_id = ?').run(req.params.id);
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除失败：' + err.message });
  }
});

function generateTimeSlots(open, close, duration) {
  const slots = [];
  let [openHour, openMin] = open.split(':').map(Number);
  let [closeHour, closeMin] = close.split(':').map(Number);
  
  let current = openHour * 60 + openMin;
  const end = closeHour * 60 + closeMin;
  
  while (current + duration <= end) {
    const start = formatTime(current);
    current += duration;
    const slotEnd = formatTime(current);
    slots.push({ start, end: slotEnd });
  }
  
  return slots;
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function isTimeOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

export default router;
