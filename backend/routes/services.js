const express = require('express');
const db = require('../config/db');
const { authenticateToken, requireRole, requireStoreOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { category, store_id, is_active } = req.query;
  let sql = 'SELECT * FROM services WHERE 1=1';
  const params = [];
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (store_id) {
    sql += ' AND store_id = ?';
    params.push(store_id);
  }
  if (is_active !== undefined) {
    sql += ' AND is_active = ?';
    params.push(is_active ? 1 : 0);
  }
  
  const services = db.prepare(sql).all(...params);
  
  for (const service of services) {
    const store = db.prepare('SELECT id, name, phone FROM users WHERE id = ?').get(service.store_id);
    service.store = store;
  }
  
  res.json(services);
});

router.get('/:id', (req, res) => {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!service) {
    return res.status(404).json({ error: '服务不存在' });
  }
  
  const store = db.prepare('SELECT id, name, phone FROM users WHERE id = ?').get(service.store_id);
  service.store = store;
  
  res.json(service);
});

router.get('/:id/slots', (req, res) => {
  const { date } = req.query;
  let sql = 'SELECT * FROM service_slots WHERE service_id = ?';
  const params = [req.params.id];
  
  if (date) {
    sql += ' AND date = ?';
    params.push(date);
  }
  
  sql += ' ORDER BY date, start_time';
  const slots = db.prepare(sql).all(...params);
  
  res.json(slots);
});

router.post('/', authenticateToken, requireRole('store', 'admin'), (req, res) => {
  const storeId = req.user.role === 'store' ? req.user.id : req.body.store_id;
  const { name, category, description, base_price, duration_minutes, pet_species, min_weight, max_weight, allow_aggressive, capacity_per_slot, room_required } = req.body;
  
  if (!name || !category || base_price === undefined) {
    return res.status(400).json({ error: '服务名称、类别和价格不能为空' });
  }
  
  const info = db.prepare(`
    INSERT INTO services (store_id, name, category, description, base_price, duration_minutes, pet_species, min_weight, max_weight, allow_aggressive, capacity_per_slot, room_required, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(storeId, name, category, description, base_price, duration_minutes || 60, pet_species || 'all', min_weight || 0, max_weight || 100, allow_aggressive ? 1 : 0, capacity_per_slot || 1, room_required ? 1 : 0);
  
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: service });
});

router.put('/:id', authenticateToken, requireStoreOrAdmin, (req, res) => {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!service) {
    return res.status(404).json({ error: '服务不存在' });
  }
  
  const { name, category, description, base_price, duration_minutes, pet_species, min_weight, max_weight, allow_aggressive, capacity_per_slot, room_required, is_active } = req.body;
  
  db.prepare(`
    UPDATE services SET name = ?, category = ?, description = ?, base_price = ?, duration_minutes = ?, 
    pet_species = ?, min_weight = ?, max_weight = ?, allow_aggressive = ?, capacity_per_slot = ?, 
    room_required = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, category, description, base_price, duration_minutes, pet_species, min_weight, max_weight, 
        allow_aggressive ? 1 : 0, capacity_per_slot, room_required ? 1 : 0, is_active ? 1 : 0, req.params.id);
  
  const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

router.post('/slots', authenticateToken, requireRole('store', 'admin', 'staff'), (req, res) => {
  const { service_id, date, start_time, end_time, max_capacity } = req.body;
  
  if (!service_id || !date || !start_time || !end_time) {
    return res.status(400).json({ error: '服务ID、日期、开始时间和结束时间不能为空' });
  }
  
  const existing = db.prepare(`
    SELECT * FROM service_slots 
    WHERE service_id = ? AND date = ? AND start_time = ?
  `).get(service_id, date, start_time);
  
  if (existing) {
    return res.status(400).json({ error: '该时段已存在' });
  }
  
  const info = db.prepare(`
    INSERT INTO service_slots (service_id, date, start_time, end_time, max_capacity, current_booked, status)
    VALUES (?, ?, ?, ?, ?, 0, 'available')
  `).run(service_id, date, start_time, end_time, max_capacity || 1);
  
  const slot = db.prepare('SELECT * FROM service_slots WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: slot });
});

router.get('/rooms/list', authenticateToken, (req, res) => {
  const { store_id, status } = req.query;
  let sql = 'SELECT * FROM boarding_rooms WHERE 1=1';
  const params = [];
  
  if (store_id) {
    sql += ' AND store_id = ?';
    params.push(store_id);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  const rooms = db.prepare(sql).all(...params);
  res.json(rooms);
});

router.post('/rooms', authenticateToken, requireRole('store', 'admin'), (req, res) => {
  const storeId = req.user.role === 'store' ? req.user.id : req.body.store_id;
  const { room_no, room_type, size, max_pets, daily_rate, facilities } = req.body;
  
  if (!room_no || !room_type || !daily_rate) {
    return res.status(400).json({ error: '房间号、类型和日租价格不能为空' });
  }
  
  const info = db.prepare(`
    INSERT INTO boarding_rooms (store_id, room_no, room_type, size, max_pets, daily_rate, facilities, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
  `).run(storeId, room_no, room_type, size, max_pets || 1, daily_rate, facilities);
  
  const room = db.prepare('SELECT * FROM boarding_rooms WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: room });
});

router.get('/consumables/list', authenticateToken, (req, res) => {
  const { store_id, category } = req.query;
  let sql = 'SELECT * FROM consumables WHERE 1=1';
  const params = [];
  
  if (store_id) {
    sql += ' AND store_id = ?';
    params.push(store_id);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  
  const consumables = db.prepare(sql).all(...params);
  res.json(consumables);
});

router.post('/consumables', authenticateToken, requireRole('store', 'admin'), (req, res) => {
  const storeId = req.user.role === 'store' ? req.user.id : req.body.store_id;
  const { name, category, unit, stock_quantity, unit_cost, supplier } = req.body;
  
  if (!name || !unit_cost) {
    return res.status(400).json({ error: '耗材名称和单价不能为空' });
  }
  
  const info = db.prepare(`
    INSERT INTO consumables (store_id, name, category, unit, stock_quantity, unit_cost, supplier)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(storeId, name, category, unit, stock_quantity || 0, unit_cost, supplier);
  
  const consumable = db.prepare('SELECT * FROM consumables WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: consumable });
});

module.exports = router;
