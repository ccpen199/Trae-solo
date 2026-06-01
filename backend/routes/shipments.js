const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

function generateShipmentNo() {
  const date = new Date();
  const prefix = 'AWB' + date.getFullYear().toString().slice(2) + 
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return prefix + random;
}

function calculateVolumeWeight(length, width, height, pieces) {
  if (!length || !width || !height) return null;
  const volume = length * width * height * pieces;
  return volume / 6000;
}

router.get('/', (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM shipments';
  let countQuery = 'SELECT COUNT(*) as total FROM shipments';
  const params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    countQuery += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  
  const shipments = db.prepare(query).all(...params, parseInt(limit), offset);
  const { total } = db.prepare(countQuery).get(...params);
  
  res.json({ shipments, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/:id', (req, res) => {
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  
  const warehouse = db.prepare('SELECT * FROM warehouse_receipts WHERE shipment_id = ? ORDER BY id DESC LIMIT 1').get(req.params.id);
  const security = db.prepare('SELECT * FROM security_checks WHERE shipment_id = ? ORDER BY id DESC LIMIT 1').get(req.params.id);
  const flightStatuses = db.prepare('SELECT * FROM flight_statuses WHERE shipment_id = ? ORDER BY status_time ASC').all(req.params.id);
  const charges = db.prepare('SELECT * FROM charges WHERE shipment_id = ?').all(req.params.id);
  const versions = db.prepare('SELECT * FROM waybill_versions WHERE shipment_id = ? ORDER BY version DESC').all(req.params.id);
  
  res.json({ shipment, warehouse, security, flightStatuses, charges, versions });
});

router.post('/', (req, res) => {
  const {
    shipper_name, shipper_phone, shipper_address,
    consignee_name, consignee_phone, consignee_address,
    pieces, weight, length, width, height,
    product_name, is_dangerous, is_battery,
    origin, destination, flight_no, flight_date, service_level
  } = req.body;
  
  if (!shipper_name || !consignee_name || !pieces || !weight || !product_name || !origin || !destination) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const volume_weight = calculateVolumeWeight(length, width, height, pieces);
  const chargeable_weight = volume_weight ? Math.max(weight, volume_weight) : weight;
  const shipment_no = generateShipmentNo();
  
  const result = db.prepare(`
    INSERT INTO shipments (
      shipment_no, shipper_name, shipper_phone, shipper_address,
      consignee_name, consignee_phone, consignee_address,
      pieces, weight, length, width, height, volume_weight, chargeable_weight,
      product_name, is_dangerous, is_battery,
      origin, destination, flight_no, flight_date, service_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    shipment_no, shipper_name, shipper_phone, shipper_address,
    consignee_name, consignee_phone, consignee_address,
    pieces, weight, length, width, height, volume_weight, chargeable_weight,
    product_name, is_dangerous ? 1 : 0, is_battery ? 1 : 0,
    origin, destination, flight_no, flight_date, service_level || 'standard'
  );
  
  db.prepare('INSERT INTO operations_log (shipment_id, operation, operator) VALUES (?, ?, ?)')
    .run(result.lastInsertRowid, 'create_shipment', 'system');
  
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(shipment);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM shipments WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  
  const {
    shipper_name, shipper_phone, shipper_address,
    consignee_name, consignee_phone, consignee_address,
    pieces, weight, length, width, height,
    product_name, is_dangerous, is_battery,
    origin, destination, flight_no, flight_date, service_level,
    master_waybill, house_waybill
  } = req.body;
  
  const volume_weight = calculateVolumeWeight(length, width, height, pieces || existing.pieces);
  const new_weight = weight !== undefined ? weight : existing.weight;
  const chargeable_weight = volume_weight ? Math.max(new_weight, volume_weight) : new_weight;
  
  db.prepare(`
    UPDATE shipments SET
      shipper_name = ?, shipper_phone = ?, shipper_address = ?,
      consignee_name = ?, consignee_phone = ?, consignee_address = ?,
      pieces = ?, weight = ?, length = ?, width = ?, height = ?,
      volume_weight = ?, chargeable_weight = ?,
      product_name = ?, is_dangerous = ?, is_battery = ?,
      origin = ?, destination = ?, flight_no = ?, flight_date = ?,
      service_level = ?, master_waybill = ?, house_waybill = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    shipper_name || existing.shipper_name,
    shipper_phone || existing.shipper_phone,
    shipper_address || existing.shipper_address,
    consignee_name || existing.consignee_name,
    consignee_phone || existing.consignee_phone,
    consignee_address || existing.consignee_address,
    pieces !== undefined ? pieces : existing.pieces,
    weight !== undefined ? weight : existing.weight,
    length !== undefined ? length : existing.length,
    width !== undefined ? width : existing.width,
    height !== undefined ? height : existing.height,
    volume_weight || existing.volume_weight,
    chargeable_weight,
    product_name || existing.product_name,
    is_dangerous !== undefined ? (is_dangerous ? 1 : 0) : existing.is_dangerous,
    is_battery !== undefined ? (is_battery ? 1 : 0) : existing.is_battery,
    origin || existing.origin,
    destination || existing.destination,
    flight_no !== undefined ? flight_no : existing.flight_no,
    flight_date !== undefined ? flight_date : existing.flight_date,
    service_level || existing.service_level,
    master_waybill !== undefined ? master_waybill : existing.master_waybill,
    house_waybill !== undefined ? house_waybill : existing.house_waybill,
    id
  );
  
  db.prepare('INSERT INTO operations_log (shipment_id, operation, operator) VALUES (?, ?, ?)')
    .run(id, 'update_shipment', 'system');
  
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(id);
  res.json(shipment);
});

router.post('/:id/approve-dangerous', (req, res) => {
  const { id } = req.params;
  const { approved, approved_by } = req.body;
  
  const existing = db.prepare('SELECT * FROM shipments WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  
  db.prepare(`
    UPDATE shipments SET
      dangerous_approved = ?,
      dangerous_approved_by = ?,
      dangerous_approved_at = CURRENT_TIMESTAMP,
      status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(approved ? 1 : 0, approved_by || 'operator', approved ? 'dangerous_approved' : 'dangerous_rejected', id);
  
  db.prepare('INSERT INTO operations_log (shipment_id, operation, operator) VALUES (?, ?, ?)')
    .run(id, 'approve_dangerous', approved_by || 'operator');
  
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(id);
  res.json(shipment);
});

router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  db.prepare('UPDATE shipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  db.prepare('INSERT INTO operations_log (shipment_id, operation, operator) VALUES (?, ?, ?)')
    .run(id, 'status_change:' + status, 'system');
  
  res.json({ success: true, status });
});

module.exports = router;
