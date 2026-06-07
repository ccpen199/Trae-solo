const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const { category, supplier_id, search } = req.query;
    let sql = 'SELECT * FROM parts WHERE 1=1';
    const params = [];
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (supplier_id) {
      sql += ' AND supplier_id = ?';
      params.push(supplier_id);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR part_number LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY created_at DESC';
    const parts = db.prepare(sql).all(...params);
    res.json(parts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { supplier_id, part_number, name, category, compatible_vehicles, price, stock_quantity, description, image_url } = req.body;
    const result = db.prepare(
      'INSERT INTO parts (supplier_id, part_number, name, category, compatible_vehicles, price, stock_quantity, description, image_url) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(supplier_id, part_number, name, category, JSON.stringify(compatible_vehicles || []), price, stock_quantity, description, image_url);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vin-match', (req, res) => {
  try {
    const { vin } = req.body;
    const matches = db.prepare(
      "SELECT * FROM vin_bom WHERE ? LIKE vin_prefix || '%' ORDER BY LENGTH(vin_prefix) DESC"
    ).all(vin);
    if (matches.length === 0) return res.status(404).json({ error: 'No matching vehicle found' });
    const match = matches[0];
    const partIds = JSON.parse(match.part_ids);
    let parts = [];
    if (partIds.length > 0) {
      const placeholders = partIds.map(() => '?').join(',');
      parts = db.prepare(`SELECT * FROM parts WHERE id IN (${placeholders})`).all(...partIds);
    }
    res.json({ vehicle_model: match.vehicle_model, vin_prefix: match.vin_prefix, year_range: match.year_range, parts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vin-bom', (req, res) => {
  try {
    const entries = db.prepare('SELECT * FROM vin_bom ORDER BY created_at DESC').all();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vin-bom', (req, res) => {
  try {
    const { vin_prefix, vehicle_model, year_range, part_ids } = req.body;
    const result = db.prepare(
      'INSERT INTO vin_bom (vin_prefix, vehicle_model, year_range, part_ids) VALUES (?,?,?,?)'
    ).run(vin_prefix, vehicle_model, year_range, JSON.stringify(part_ids || []));
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders', (req, res) => {
  try {
    const { requester_id, supplier_id, part_id, quantity } = req.body;
    const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(part_id);
    if (!part) return res.status(404).json({ error: 'Part not found' });
    const total_price = part.price * quantity;
    db.prepare('UPDATE parts SET stock_quantity = stock_quantity - ? WHERE id = ?').run(quantity, part_id);
    const result = db.prepare(
      'INSERT INTO parts_orders (requester_id, supplier_id, part_id, quantity, total_price) VALUES (?,?,?,?,?)'
    ).run(requester_id, supplier_id, part_id, quantity, total_price);
    res.status(201).json({ id: result.lastInsertRowid, total_price });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders', (req, res) => {
  try {
    const { status, requester_id, supplier_id } = req.query;
    let sql = 'SELECT o.*, p.name as part_name, p.part_number FROM parts_orders o JOIN parts p ON o.part_id = p.id WHERE 1=1';
    const params = [];
    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    if (requester_id) {
      sql += ' AND o.requester_id = ?';
      params.push(requester_id);
    }
    if (supplier_id) {
      sql += ' AND o.supplier_id = ?';
      params.push(supplier_id);
    }
    sql += ' ORDER BY o.created_at DESC';
    const orders = db.prepare(sql).all(...params);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/orders/:id', (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE parts_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
    res.json({ id: Number(req.params.id), status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/traceability', (req, res) => {
  try {
    const { part_id, action, operator_id, location, scan_code, notes } = req.body;
    const result = db.prepare(
      'INSERT INTO parts_traceability (part_id, action, operator_id, location, scan_code, notes) VALUES (?,?,?,?,?,?)'
    ).run(part_id, action, operator_id, location, scan_code, notes);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/traceability', (req, res) => {
  try {
    const { part_id, order_id } = req.query;
    let sql = 'SELECT * FROM parts_traceability WHERE 1=1';
    const params = [];
    if (part_id) {
      sql += ' AND part_id = ?';
      params.push(part_id);
    }
    if (order_id) {
      sql += ' AND order_id = ?';
      params.push(order_id);
    }
    sql += ' ORDER BY created_at DESC';
    const records = db.prepare(sql).all(...params);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(req.params.id);
    if (!part) return res.status(404).json({ error: 'Part not found' });
    res.json(part);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { part_number, name, category, compatible_vehicles, price, stock_quantity, description, image_url } = req.body;
    const fields = [];
    const params = [];
    if (part_number !== undefined) { fields.push('part_number = ?'); params.push(part_number); }
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (category !== undefined) { fields.push('category = ?'); params.push(category); }
    if (compatible_vehicles !== undefined) { fields.push('compatible_vehicles = ?'); params.push(JSON.stringify(compatible_vehicles)); }
    if (price !== undefined) { fields.push('price = ?'); params.push(price); }
    if (stock_quantity !== undefined) { fields.push('stock_quantity = ?'); params.push(stock_quantity); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (image_url !== undefined) { fields.push('image_url = ?'); params.push(image_url); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    db.prepare(`UPDATE parts SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    res.json({ id: Number(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/trace', (req, res) => {
  try {
    const records = db.prepare('SELECT * FROM parts_traceability WHERE part_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
