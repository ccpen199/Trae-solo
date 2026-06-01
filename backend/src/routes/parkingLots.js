import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const lots = db.prepare('SELECT * FROM parking_lots ORDER BY created_at DESC').all();
  res.json(lots);
});

router.get('/:id', (req, res) => {
  const lot = db.prepare('SELECT * FROM parking_lots WHERE id = ?').get(req.params.id);
  if (!lot) return res.status(404).json({ error: 'Not found' });
  res.json(lot);
});

router.post('/', (req, res) => {
  const { name, address, latitude, longitude, entrance_points, total_spots, charging_spots, price_per_hour, business_hours } = req.body;
  const stmt = db.prepare(`
    INSERT INTO parking_lots (name, address, latitude, longitude, entrance_points, total_spots, charging_spots, price_per_hour, business_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name, address, latitude, longitude, JSON.stringify(entrance_points || []), total_spots, charging_spots, price_per_hour, business_hours);
  
  const spotStmt = db.prepare('INSERT INTO spot_status (parking_lot_id, spot_number, spot_type, status) VALUES (?, ?, ?, ?)');
  for (let i = 1; i <= total_spots; i++) {
    const spotType = i <= charging_spots ? 'charging' : 'normal';
    spotStmt.run(result.lastInsertRowid, `A${String(i).padStart(3, '0')}`, spotType, 'available');
  }
  
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { name, address, latitude, longitude, entrance_points, total_spots, charging_spots, price_per_hour, business_hours, device_status } = req.body;
  db.prepare(`
    UPDATE parking_lots SET name=?, address=?, latitude=?, longitude=?, entrance_points=?, 
    total_spots=?, charging_spots=?, price_per_hour=?, business_hours=?, device_status=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(name, address, latitude, longitude, JSON.stringify(entrance_points || []), total_spots, charging_spots, price_per_hour, business_hours, device_status || 'online', req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM spot_status WHERE parking_lot_id = ?').run(req.params.id);
  db.prepare('DELETE FROM parking_lots WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
