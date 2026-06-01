const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const { status, vehicle_id } = req.query;
  let sql = `
    SELECT m.*, v.plate_number, v.brand, v.model
    FROM maintenances m
    LEFT JOIN vehicles v ON m.vehicle_id = v.id
    WHERE 1=1
  `;
  const params = [];
  if (status) {
    sql += ' AND m.status = ?';
    params.push(status);
  }
  if (vehicle_id) {
    sql += ' AND m.vehicle_id = ?';
    params.push(vehicle_id);
  }
  sql += ' ORDER BY m.id DESC';
  const maintenances = db.prepare(sql).all(...params);
  res.json(maintenances);
});

router.get('/:id', (req, res) => {
  const maintenance = db.prepare(`
    SELECT m.*, v.plate_number, v.brand, v.model
    FROM maintenances m
    LEFT JOIN vehicles v ON m.vehicle_id = v.id
    WHERE m.id = ?
  `).get(req.params.id);
  if (!maintenance) return res.status(404).json({ error: '保养记录不存在' });
  res.json(maintenance);
});

router.post('/', (req, res) => {
  const { vehicle_id, type, description, mileage, cost, scheduled_date } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO maintenances (vehicle_id, type, description, mileage, cost, scheduled_date, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(vehicle_id, type, description, mileage || 0, cost || 0, scheduled_date);
    
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/start', (req, res) => {
  const maintenanceId = req.params.id;
  const maintenance = db.prepare('SELECT * FROM maintenances WHERE id = ?').get(maintenanceId);
  if (!maintenance) return res.status(404).json({ error: '保养记录不存在' });
  
  db.prepare('UPDATE maintenances SET status = ?, started_date = CURRENT_TIMESTAMP WHERE id = ?').run('in_progress', maintenanceId);
  db.prepare('UPDATE vehicles SET status = ? WHERE id = ?').run('maintenance', maintenance.vehicle_id);
  
  res.json({ success: true });
});

router.put('/:id/complete', (req, res) => {
  const maintenanceId = req.params.id;
  const { cost, description } = req.body;
  
  const maintenance = db.prepare('SELECT * FROM maintenances WHERE id = ?').get(maintenanceId);
  if (!maintenance) return res.status(404).json({ error: '保养记录不存在' });
  
  db.prepare(`
    UPDATE maintenances 
    SET status = 'completed', completed_date = CURRENT_TIMESTAMP, cost = ?, description = ?
    WHERE id = ?
  `).run(cost || maintenance.cost, description || maintenance.description, maintenanceId);
  
  db.prepare(`
    UPDATE vehicles 
    SET status = 'available', last_maintenance_date = DATE('now'), last_maintenance_km = mileage
    WHERE id = ?
  `).run(maintenance.vehicle_id);
  
  res.json({ success: true });
});

router.put('/:id', (req, res) => {
  const { vehicle_id, type, description, mileage, cost, scheduled_date, status } = req.body;
  db.prepare(`
    UPDATE maintenances 
    SET vehicle_id = ?, type = ?, description = ?, mileage = ?, cost = ?, scheduled_date = ?, status = ?
    WHERE id = ?
  `).run(vehicle_id, type, description, mileage, cost, scheduled_date, status, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM maintenances WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
