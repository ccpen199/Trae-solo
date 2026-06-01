const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const db = req.app.get('db');
  const { status, rarity, scene, keyword, page = 1, pageSize = 20 } = req.query;

  let sql = 'SELECT * FROM gifts WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM gifts WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    countSql += ' AND status = ?';
    params.push(status);
  }
  if (rarity) {
    sql += ' AND rarity = ?';
    countSql += ' AND rarity = ?';
    params.push(rarity);
  }
  if (scene) {
    sql += ' AND scene LIKE ?';
    countSql += ' AND scene LIKE ?';
    params.push(`%${scene}%`);
  }
  if (keyword) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    countSql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += ' ORDER BY sort_order ASC, id DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, Number(pageSize), (Number(page) - 1) * Number(pageSize)];

  const gifts = db.prepare(sql).all(...queryParams);
  const { total } = db.prepare(countSql).get(...params);

  res.json({ items: gifts, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/:id', (req, res) => {
  const db = req.app.get('db');
  const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(req.params.id);
  if (!gift) {
    return res.status(404).json({ error: '礼物不存在' });
  }
  res.json(gift);
});

router.post('/', authMiddleware(['admin', 'operator']), (req, res) => {
  const { name, icon, animation, price, rarity, scene, stock, sort_order, description } = req.body;
  const db = req.app.get('db');

  const result = db.prepare(`
    INSERT INTO gifts (name, icon, animation, price, rarity, scene, stock, sort_order, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, icon, animation, price, rarity, scene, stock, sort_order, description);

  res.json({ id: result.lastInsertRowid, success: true });
});

router.put('/:id', authMiddleware(['admin', 'operator']), (req, res) => {
  const { name, icon, animation, price, rarity, scene, stock, sort_order, description, status } = req.body;
  const db = req.app.get('db');

  const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(req.params.id);
  if (!gift) {
    return res.status(404).json({ error: '礼物不存在' });
  }

  db.prepare(`
    UPDATE gifts 
    SET name = ?, icon = ?, animation = ?, price = ?, rarity = ?, scene = ?, 
        stock = ?, sort_order = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, icon, animation, price, rarity, scene, stock, sort_order, description, status, req.params.id);

  res.json({ success: true });
});

router.patch('/:id/status', authMiddleware(['admin', 'operator']), (req, res) => {
  const { status } = req.body;
  const db = req.app.get('db');

  const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(req.params.id);
  if (!gift) {
    return res.status(404).json({ error: '礼物不存在' });
  }

  const timeField = status === 'online' ? 'online_time' : 'offline_time';
  db.prepare(`
    UPDATE gifts 
    SET status = ?, ${timeField} = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, req.params.id);

  res.json({ success: true });
});

router.delete('/:id', authMiddleware(['admin']), (req, res) => {
  const db = req.app.get('db');
  const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(req.params.id);
  if (!gift) {
    return res.status(404).json({ error: '礼物不存在' });
  }

  db.prepare('DELETE FROM gifts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
