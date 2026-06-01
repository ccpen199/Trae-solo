const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const { status, store_id } = req.query;
  let sql = `
    SELECT v.*, s.name as store_name 
    FROM vehicles v 
    LEFT JOIN stores s ON v.store_id = s.id 
    WHERE 1=1
  `;
  const params = [];
  if (status) {
    sql += ' AND v.status = ?';
    params.push(status);
  }
  if (store_id) {
    sql += ' AND v.store_id = ?';
    params.push(store_id);
  }
  sql += ' ORDER BY v.id DESC';
  const vehicles = db.prepare(sql).all(...params);
  
  const today = new Date().toISOString().split('T')[0];
  vehicles.forEach(v => {
    v.is_insurance_expired = v.insurance_expire_date && v.insurance_expire_date < today;
    v.is_inspection_expired = v.inspection_expire_date && v.inspection_expire_date < today;
    v.need_maintenance = (v.mileage - v.last_maintenance_km) >= v.maintenance_cycle_km;
  });
  
  res.json(vehicles);
});

router.get('/available', (req, res) => {
  const { pickup_date, return_date, store_id } = req.query;
  
  let sql = `
    SELECT v.*, s.name as store_name 
    FROM vehicles v 
    LEFT JOIN stores s ON v.store_id = s.id 
    WHERE v.status = 'available'
  `;
  const params = [];
  
  if (store_id) {
    sql += ' AND v.store_id = ?';
    params.push(store_id);
  }
  
  if (pickup_date && return_date) {
    sql += ` AND v.id NOT IN (
      SELECT vehicle_id FROM orders 
      WHERE status IN ('confirmed', 'picked_up')
      AND pickup_date < ? AND return_date > ?
    )`;
    params.push(return_date, pickup_date);
  }
  
  const vehicles = db.prepare(sql).all(...params);
  res.json(vehicles);
});

router.get('/:id', (req, res) => {
  const vehicle = db.prepare(`
    SELECT v.*, s.name as store_name 
    FROM vehicles v 
    LEFT JOIN stores s ON v.store_id = s.id 
    WHERE v.id = ?
  `).get(req.params.id);
  
  if (!vehicle) return res.status(404).json({ error: '车辆不存在' });
  
  const today = new Date().toISOString().split('T')[0];
  vehicle.is_insurance_expired = vehicle.insurance_expire_date && vehicle.insurance_expire_date < today;
  vehicle.is_inspection_expired = vehicle.inspection_expire_date && vehicle.inspection_expire_date < today;
  vehicle.need_maintenance = (vehicle.mileage - vehicle.last_maintenance_km) >= vehicle.maintenance_cycle_km;
  
  res.json(vehicle);
});

router.post('/', (req, res) => {
  const {
    plate_number, brand, model, year, color, mileage, store_id, status,
    insurance_expire_date, inspection_expire_date, maintenance_cycle_km, daily_rate
  } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO vehicles (plate_number, brand, model, year, color, mileage, store_id, status,
                            insurance_expire_date, inspection_expire_date, maintenance_cycle_km, daily_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(plate_number, brand, model, year, color, mileage || 0, store_id, status || 'available',
           insurance_expire_date, inspection_expire_date, maintenance_cycle_km || 5000, daily_rate || 200);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) return res.status(404).json({ error: '车辆不存在' });
  
  const {
    plate_number, brand, model, year, color, mileage, store_id, status,
    insurance_expire_date, inspection_expire_date, maintenance_cycle_km, daily_rate
  } = req.body;
  
  db.prepare(`
    UPDATE vehicles SET 
      plate_number = ?, brand = ?, model = ?, year = ?, color = ?, 
      mileage = ?, store_id = ?, status = ?, insurance_expire_date = ?, 
      inspection_expire_date = ?, maintenance_cycle_km = ?, daily_rate = ?
    WHERE id = ?
  `).run(plate_number || vehicle.plate_number, brand || vehicle.brand, model || vehicle.model, 
         year || vehicle.year, color || vehicle.color, mileage ?? vehicle.mileage, 
         store_id ?? vehicle.store_id, status || vehicle.status, 
         insurance_expire_date ?? vehicle.insurance_expire_date, 
         inspection_expire_date ?? vehicle.inspection_expire_date, 
         maintenance_cycle_km || vehicle.maintenance_cycle_km, 
         daily_rate || vehicle.daily_rate, req.params.id);
  
  res.json({ success: true });
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE vehicles SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM vehicles WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
