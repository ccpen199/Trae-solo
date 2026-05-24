const express = require('express');
const db = require('../db');
const { authenticate, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/list', (req, res) => {
  const stations = db.prepare('SELECT * FROM stations WHERE status = ? ORDER BY id').all('active');
  res.json(stations);
});

router.get('/fuel-types', (req, res) => {
  const fuelTypes = db.prepare('SELECT * FROM fuel_types WHERE status = ?').all('active');
  res.json(fuelTypes);
});

router.get('/:id/prices', (req, res) => {
  const prices = db.prepare(`
    SELECT sfp.*, ft.code, ft.name as fuel_type_name
    FROM station_fuel_prices sfp
    JOIN fuel_types ft ON sfp.fuel_type_id = ft.id
    WHERE sfp.station_id = ? AND sfp.effective_to IS NULL
    ORDER BY ft.id
  `).all(req.params.id);
  res.json(prices);
});

router.get('/:id/nozzles', (req, res) => {
  const nozzles = db.prepare(`
    SELECT n.*, ft.code, ft.name as fuel_type_name
    FROM nozzles n
    JOIN fuel_types ft ON n.fuel_type_id = ft.id
    WHERE n.station_id = ? AND n.status = ?
    ORDER BY n.nozzle_number
  `).all(req.params.id, 'active');
  res.json(nozzles);
});

router.get('/:id/inventory', authenticate, requireRoles(['manager', 'hq', 'operation', 'finance']), (req, res) => {
  const inventory = db.prepare(`
    SELECT ti.*, ft.code, ft.name as fuel_type_name
    FROM tank_inventory ti
    JOIN fuel_types ft ON ti.fuel_type_id = ft.id
    WHERE ti.station_id = ?
    ORDER BY ft.id
  `).all(req.params.id);
  res.json(inventory);
});

router.post('/price-adjust', authenticate, requireRoles(['manager', 'hq']), (req, res) => {
  const { station_id, fuel_type_id, price, effective_from } = req.body;
  if (!station_id || !fuel_type_id || !price) {
    return res.status(400).json({ error: '请填写完整的调价信息' });
  }
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE station_fuel_prices 
      SET effective_to = ? 
      WHERE station_id = ? AND fuel_type_id = ? AND effective_to IS NULL
    `).run(effective_from || new Date().toISOString(), station_id, fuel_type_id);
    
    db.prepare(`
      INSERT INTO station_fuel_prices 
      (station_id, fuel_type_id, price, effective_from, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(station_id, fuel_type_id, price, effective_from || new Date().toISOString(), req.user.id);
  });
  tx();
  res.json({ message: '油价调整成功' });
});

router.post('/inventory/delivery', authenticate, requireRoles(['manager', 'hq']), (req, res) => {
  const { station_id, fuel_type_id, volume, unit_cost } = req.body;
  if (!station_id || !fuel_type_id || !volume) {
    return res.status(400).json({ error: '请填写完整的入库信息' });
  }
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE tank_inventory 
      SET current_volume = current_volume + ?, last_updated = CURRENT_TIMESTAMP
      WHERE station_id = ? AND fuel_type_id = ?
    `).run(volume, station_id, fuel_type_id);
    
    db.prepare(`
      INSERT INTO inventory_transactions 
      (station_id, fuel_type_id, type, volume, unit_cost, operator_id)
      VALUES (?, ?, 'delivery', ?, ?, ?)
    `).run(station_id, fuel_type_id, volume, unit_cost || null, req.user.id);
  });
  tx();
  res.json({ message: '库存入库成功' });
});

module.exports = router;
