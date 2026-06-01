const router = require('express').Router();
const { getDb } = require('../db');

router.get('/', (req, res) => {
  const db = getDb();
  const { action, operator, start, end, page = 1, pageSize = 50 } = req.query;
  let sql = 'SELECT * FROM operations_log WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as c FROM operations_log WHERE 1=1';
  const params = [];
  if (action) { sql += ' AND action = ?'; countSql += ' AND action = ?'; params.push(action); }
  if (operator) { sql += ' AND operator LIKE ?'; countSql += ' AND operator LIKE ?'; params.push(`%${operator}%`); }
  if (start) { sql += ' AND created_at >= ?'; countSql += ' AND created_at >= ?'; params.push(start); }
  if (end) { sql += ' AND created_at <= ?'; countSql += ' AND created_at <= ?'; params.push(end); }
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  const p = parseInt(page), ps = parseInt(pageSize);
  params.push(ps, (p - 1) * ps);
  const rows = db.prepare(sql).all(...params);
  const total = db.prepare(countSql).get(...params.slice(0, params.length - 2)).c;
  res.json({ rows, total, page: p, pageSize: ps });
});

router.get('/actions', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT DISTINCT action FROM operations_log ORDER BY action').all();
  res.json(rows.map(r => r.action));
});

module.exports = router;