const express = require('express');
const { db } = require('../database');

const router = express.Router();

const NODE_TYPES = {
  check_in: '托运',
  security: '安检',
  loading: '装机',
  transfer: '中转',
  unloading: '卸机',
  carousel: '转盘',
  pickup: '领取'
};

const NODE_ORDER = ['check_in', 'security', 'loading', 'transfer', 'unloading', 'carousel', 'pickup'];

router.post('/', (req, res) => {
  const { baggage_tag, node_type, location, operator, remark, node_time } = req.body;

  if (!baggage_tag || !node_type || !node_time) {
    return res.status(400).json({ error: 'Missing required fields: baggage_tag, node_type, node_time' });
  }

  if (!NODE_TYPES[node_type]) {
    return res.status(400).json({ error: 'Invalid node_type. Valid types: ' + Object.keys(NODE_TYPES).join(', ') });
  }

  const baggage = db.prepare('SELECT * FROM baggage WHERE baggage_tag = ?').get(baggage_tag);
  if (!baggage) {
    return res.status(404).json({ error: 'Baggage not found' });
  }

  const existing = db.prepare(`
    SELECT * FROM baggage_nodes WHERE baggage_id = ? AND node_type = ?
  `).get(baggage.id, node_type);

  if (existing) {
    return res.status(409).json({ error: `Node ${node_type} already exists for this baggage`, existing });
  }

  const stmt = db.prepare(`
    INSERT INTO baggage_nodes (baggage_id, node_type, node_name, location, operator, remark, node_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    baggage.id,
    node_type,
    NODE_TYPES[node_type],
    location || '',
    operator || '',
    remark || '',
    node_time
  );

  if (node_type === 'pickup') {
    db.prepare('UPDATE baggage SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('picked_up', baggage.id);
  } else if (node_type === 'unloading' || node_type === 'carousel') {
    db.prepare('UPDATE baggage SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('arrived', baggage.id);
  }

  const node = db.prepare('SELECT * FROM baggage_nodes WHERE id = ?').get(result.lastInsertRowid);

  const allNodes = db.prepare(`
    SELECT * FROM baggage_nodes WHERE baggage_id = ? ORDER BY node_time ASC
  `).all(baggage.id);

  const existingTypes = allNodes.map(n => n.node_type);
  const missingNodes = NODE_ORDER.filter(n => !existingTypes.includes(n));

  res.status(201).json({
    node,
    missing_nodes: missingNodes,
    has_missing_nodes: missingNodes.length > 0 && node_type !== 'pickup'
  });
});

router.get('/baggage/:baggageId', (req, res) => {
  const { baggageId } = req.params;

  const nodes = db.prepare(`
    SELECT * FROM baggage_nodes WHERE baggage_id = ? ORDER BY node_time ASC
  `).all(baggageId);

  const existingTypes = nodes.map(n => n.node_type);
  const missingNodes = NODE_ORDER.filter(n => !existingTypes.includes(n));

  res.json({
    nodes,
    expected_nodes: NODE_ORDER.map(t => ({ type: t, name: NODE_TYPES[t] })),
    missing_nodes: missingNodes,
    has_missing_nodes: missingNodes.length > 0 && !existingTypes.includes('pickup')
  });
});

router.get('/alerts', (req, res) => {
  const { hours = 24 } = req.query;

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const sql = `
    SELECT b.*, 
           GROUP_CONCAT(bn.node_type) as existing_nodes,
           MAX(bn.node_time) as last_node_time
    FROM baggage b
    LEFT JOIN baggage_nodes bn ON b.id = bn.baggage_id
    WHERE b.status != 'picked_up' AND b.status != 'lost'
      AND b.created_at >= ?
    GROUP BY b.id
    HAVING existing_nodes IS NULL 
        OR (existing_nodes NOT LIKE '%pickup%' 
            AND (
              existing_nodes NOT LIKE '%security%'
              OR existing_nodes NOT LIKE '%loading%'
              OR existing_nodes NOT LIKE '%unloading%'
              OR existing_nodes NOT LIKE '%carousel%'
            )
           )
    ORDER BY b.created_at DESC
  `;

  const alertBaggages = db.prepare(sql).all(cutoff);

  const alerts = alertBaggages.map(b => {
    const existing = b.existing_nodes ? b.existing_nodes.split(',') : [];
    const missing = NODE_ORDER.filter(n => !existing.includes(n));
    return {
      ...b,
      existing_nodes: existing,
      missing_nodes: missing,
      alert_type: missing.length > 3 ? 'critical' : missing.length > 1 ? 'warning' : 'info'
    };
  });

  res.json({
    alerts,
    count: alerts.length,
    cutoff
  });
});

router.get('/types', (req, res) => {
  res.json(
    NODE_ORDER.map(t => ({ type: t, name: NODE_TYPES[t] }))
  );
});

module.exports = router;
