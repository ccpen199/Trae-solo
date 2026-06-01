const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const exceptions = db.prepare(`
    SELECT e.*, o.order_no
    FROM exceptions e
    LEFT JOIN orders o ON e.order_id = o.id
    ORDER BY e.created_at DESC
  `).all();
  res.json(exceptions);
});

router.post('/', (req, res) => {
  const { order_id, type, description } = req.body;
  const result = db.prepare(
    'INSERT INTO exceptions (order_id, type, description) VALUES (?, ?, ?)'
  ).run(order_id, type, description);
  res.json({ id: result.lastInsertRowid, order_id, type, description, status: 'open' });
});

router.put('/:id/resolve', (req, res) => {
  db.prepare('UPDATE exceptions SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?').run('resolved', req.params.id);
  res.json({ success: true });
});

module.exports = router;
