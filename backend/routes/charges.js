const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

router.post('/calculate', (req, res) => {
  const { shipment_id, charge_weight, unit_price, fuel_surcharge, security_surcharge, other_charges } = req.body;
  
  if (!shipment_id) {
    return res.status(400).json({ error: 'Shipment ID is required' });
  }
  
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(shipment_id);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  
  const actual_charge_weight = charge_weight || shipment.chargeable_weight || shipment.weight;
  
  const freight = actual_charge_weight * (unit_price || 0);
  const fuel = fuel_surcharge || 0;
  const security = security_surcharge || 0;
  const other = other_charges || 0;
  const total = freight + fuel + security + other;
  
  res.json({
    chargeable_weight: actual_charge_weight,
    unit_price: unit_price || 0,
    freight_charge: freight,
    fuel_surcharge: fuel,
    security_surcharge: security,
    other_charges: other,
    total_amount: total
  });
});

router.post('/add', (req, res) => {
  const { shipment_id, charge_type, charge_name, amount, currency, charge_weight, unit_price } = req.body;
  
  if (!shipment_id || !charge_type || !charge_name || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(shipment_id);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  
  const result = db.prepare(`
    INSERT INTO charges (shipment_id, charge_type, charge_name, amount, currency, charge_weight, unit_price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(shipment_id, charge_type, charge_name, amount, currency || 'CNY', charge_weight, unit_price);
  
  db.prepare('INSERT INTO operations_log (shipment_id, operation, operator) VALUES (?, ?, ?)')
    .run(shipment_id, 'add_charge:' + charge_type, 'finance');
  
  const charge = db.prepare('SELECT * FROM charges WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(charge);
});

router.get('/:shipment_id', (req, res) => {
  const charges = db.prepare('SELECT * FROM charges WHERE shipment_id = ?').all(req.params.shipment_id);
  const total = charges.reduce((sum, c) => sum + c.amount, 0);
  res.json({ charges, total_amount: total });
});

router.post('/verify', (req, res) => {
  const { charge_id, verified_by, is_verified } = req.body;
  
  const charge = db.prepare('SELECT * FROM charges WHERE id = ?').get(charge_id);
  if (!charge) {
    return res.status(404).json({ error: 'Charge not found' });
  }
  
  db.prepare('UPDATE charges SET is_verified = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(is_verified ? 1 : 0, verified_by || 'finance', charge_id);
  
  db.prepare('INSERT INTO operations_log (shipment_id, operation, operator) VALUES (?, ?, ?)')
    .run(charge.shipment_id, 'verify_charge:' + charge_id, verified_by || 'finance');
  
  const updated = db.prepare('SELECT * FROM charges WHERE id = ?').get(charge_id);
  res.json(updated);
});

module.exports = router;
