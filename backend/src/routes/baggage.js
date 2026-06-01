const express = require('express');
const { db } = require('../database');

const router = express.Router();

function generateBaggageTag() {
  const prefix = 'BN';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}${timestamp}${random}`;
}

router.post('/', (req, res) => {
  const {
    passenger_name,
    passenger_phone,
    passenger_id_card,
    flight_no,
    flight_date,
    departure,
    destination,
    pieces,
    weight,
    check_in_time,
    baggage_tag
  } = req.body;

  if (!passenger_name || !flight_no || !flight_date || !departure || !destination || !weight || !check_in_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const tag = baggage_tag || generateBaggageTag();

  try {
    const stmt = db.prepare(`
      INSERT INTO baggage (
        baggage_tag, passenger_name, passenger_phone, passenger_id_card,
        flight_no, flight_date, departure, destination, pieces, weight, check_in_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      tag, passenger_name, passenger_phone || '', passenger_id_card || '',
      flight_no, flight_date, departure, destination, pieces || 1, weight, check_in_time
    );

    const nodeStmt = db.prepare(`
      INSERT INTO baggage_nodes (baggage_id, node_type, node_name, location, node_time)
      VALUES (?, 'check_in', '托运', ?, ?)
    `);
    nodeStmt.run(result.lastInsertRowid, departure, check_in_time);

    const baggage = db.prepare('SELECT * FROM baggage WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(baggage);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Baggage tag already exists' });
    }
    throw err;
  }
});

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, baggage_tag, flight_no, passenger_name, status } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClauses = [];
  let params = [];

  if (baggage_tag) {
    whereClauses.push('baggage_tag LIKE ?');
    params.push(`%${baggage_tag}%`);
  }
  if (flight_no) {
    whereClauses.push('flight_no LIKE ?');
    params.push(`%${flight_no}%`);
  }
  if (passenger_name) {
    whereClauses.push('passenger_name LIKE ?');
    params.push(`%${passenger_name}%`);
  }
  if (status) {
    whereClauses.push('status = ?');
    params.push(status);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM baggage ${whereSql}`).get(...params);
  const list = db.prepare(`
    SELECT * FROM baggage ${whereSql}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), parseInt(offset));

  res.json({
    list,
    total: total.count,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/:tag', (req, res) => {
  const { tag } = req.params;

  const baggage = db.prepare('SELECT * FROM baggage WHERE baggage_tag = ?').get(tag);
  if (!baggage) {
    return res.status(404).json({ error: 'Baggage not found' });
  }

  const nodes = db.prepare(`
    SELECT * FROM baggage_nodes WHERE baggage_id = ? ORDER BY node_time ASC
  `).all(baggage.id);

  const exceptions = db.prepare(`
    SELECT * FROM baggage_exceptions WHERE baggage_id = ? ORDER BY report_time DESC
  `).all(baggage.id);

  const expectedNodes = ['check_in', 'security', 'loading', 'transfer', 'unloading', 'carousel', 'pickup'];
  const existingTypes = nodes.map(n => n.node_type);
  const missingNodes = expectedNodes.filter(n => !existingTypes.includes(n));

  res.json({
    baggage,
    nodes,
    exceptions,
    missing_nodes: missingNodes,
    has_missing_nodes: missingNodes.length > 0 && !existingTypes.includes('pickup')
  });
});

router.get('/:tag/full', (req, res) => {
  const { tag } = req.params;

  const baggage = db.prepare('SELECT * FROM baggage WHERE baggage_tag = ?').get(tag);
  if (!baggage) {
    return res.status(404).json({ error: 'Baggage not found' });
  }

  const nodes = db.prepare(`
    SELECT * FROM baggage_nodes WHERE baggage_id = ? ORDER BY node_time ASC
  `).all(baggage.id);

  const exceptions = db.prepare(`
    SELECT be.*, 
           (SELECT COUNT(*) FROM exception_photos ep WHERE ep.exception_id = be.id) as photo_count
    FROM baggage_exceptions be 
    WHERE be.baggage_id = ? 
    ORDER BY be.report_time DESC
  `).all(baggage.id);

  const exceptionIds = exceptions.map(e => e.id);
  let compensations = [];
  if (exceptionIds.length > 0) {
    const placeholders = exceptionIds.map(() => '?').join(',');
    compensations = db.prepare(`
      SELECT * FROM compensation_records WHERE exception_id IN (${placeholders})
      ORDER BY created_at DESC
    `).all(...exceptionIds);
  }

  let progress = [];
  if (exceptionIds.length > 0) {
    const placeholders = exceptionIds.map(() => '?').join(',');
    progress = db.prepare(`
      SELECT * FROM progress_records WHERE exception_id IN (${placeholders})
      ORDER BY created_at DESC
    `).all(...exceptionIds);
  }

  const expectedNodes = ['check_in', 'security', 'loading', 'transfer', 'unloading', 'carousel', 'pickup'];
  const existingTypes = nodes.map(n => n.node_type);
  const missingNodes = expectedNodes.filter(n => !existingTypes.includes(n));

  res.json({
    baggage,
    nodes,
    exceptions,
    compensations,
    progress,
    missing_nodes: missingNodes,
    has_missing_nodes: missingNodes.length > 0 && !existingTypes.includes('pickup')
  });
});

router.put('/:tag/status', (req, res) => {
  const { tag } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const validStatuses = ['in_transit', 'arrived', 'picked_up', 'exception', 'lost'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const result = db.prepare(`
    UPDATE baggage SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE baggage_tag = ?
  `).run(status, tag);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Baggage not found' });
  }

  const baggage = db.prepare('SELECT * FROM baggage WHERE baggage_tag = ?').get(tag);
  res.json(baggage);
});

module.exports = router;
