const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  const { building_id } = req.query;
  
  let sql = `
    SELECT c.*, b.name as building_name,
           COUNT(DISTINCT ci.id) as check_item_count
    FROM checkpoints c
    LEFT JOIN buildings b ON c.building_id = b.id
    LEFT JOIN check_items ci ON c.id = ci.checkpoint_id
  `;
  
  const params = [];
  if (building_id) {
    sql += ' WHERE c.building_id = ?';
    params.push(building_id);
  }
  
  sql += ' GROUP BY c.id ORDER BY c.created_at DESC';
  
  const checkpoints = db.prepare(sql).all(...params);
  res.json(checkpoints);
});

router.get('/:id', (req, res) => {
  const checkpoint = db.prepare(`
    SELECT c.*, b.name as building_name
    FROM checkpoints c
    LEFT JOIN buildings b ON c.building_id = b.id
    WHERE c.id = ?
  `).get(req.params.id);
  
  if (!checkpoint) {
    return res.status(404).json({ error: '点位不存在' });
  }
  
  const checkItems = db.prepare('SELECT * FROM check_items WHERE checkpoint_id = ? ORDER BY id').get(req.params.id);
  checkpoint.check_items = checkItems || [];
  
  res.json(checkpoint);
});

router.get('/qrcode/:qr_code', (req, res) => {
  const checkpoint = db.prepare(`
    SELECT c.*, b.name as building_name
    FROM checkpoints c
    LEFT JOIN buildings b ON c.building_id = b.id
    WHERE c.qr_code = ?
  `).get(req.params.qr_code);
  
  if (!checkpoint) {
    return res.status(404).json({ error: '点位不存在' });
  }
  
  const checkItems = db.prepare('SELECT * FROM check_items WHERE checkpoint_id = ? ORDER BY id').all(checkpoint.id);
  checkpoint.check_items = checkItems;
  
  res.json(checkpoint);
});

router.post('/', requireRole('manager'), (req, res) => {
  const { building_id, name, qr_code, location, latitude, longitude } = req.body;
  
  if (!building_id || !name || !qr_code) {
    return res.status(400).json({ error: '楼栋、名称和二维码不能为空' });
  }

  const existing = db.prepare('SELECT id FROM checkpoints WHERE qr_code = ?').get(qr_code);
  if (existing) {
    return res.status(400).json({ error: '二维码已存在' });
  }

  const result = db.prepare(`
    INSERT INTO checkpoints (building_id, name, qr_code, location, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(building_id, name, qr_code, location || '', latitude || null, longitude || null);

  const checkpoint = db.prepare('SELECT * FROM checkpoints WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(checkpoint);
});

router.put('/:id', requireRole('manager'), (req, res) => {
  const { name, qr_code, location, latitude, longitude } = req.body;
  
  const checkpoint = db.prepare('SELECT * FROM checkpoints WHERE id = ?').get(req.params.id);
  if (!checkpoint) {
    return res.status(404).json({ error: '点位不存在' });
  }

  if (qr_code && qr_code !== checkpoint.qr_code) {
    const existing = db.prepare('SELECT id FROM checkpoints WHERE qr_code = ?').get(qr_code);
    if (existing) {
      return res.status(400).json({ error: '二维码已存在' });
    }
  }

  db.prepare(`
    UPDATE checkpoints SET name = ?, qr_code = ?, location = ?, latitude = ?, longitude = ?
    WHERE id = ?
  `).run(
    name || checkpoint.name,
    qr_code || checkpoint.qr_code,
    location !== undefined ? location : checkpoint.location,
    latitude !== undefined ? latitude : checkpoint.latitude,
    longitude !== undefined ? longitude : checkpoint.longitude,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM checkpoints WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', requireRole('manager'), (req, res) => {
  const checkpoint = db.prepare('SELECT * FROM checkpoints WHERE id = ?').get(req.params.id);
  if (!checkpoint) {
    return res.status(404).json({ error: '点位不存在' });
  }

  db.prepare('DELETE FROM checkpoints WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.post('/:id/items', requireRole('manager'), (req, res) => {
  const { name, description, type } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '检查项名称不能为空' });
  }

  const result = db.prepare(`
    INSERT INTO check_items (checkpoint_id, name, description, type)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, name, description || '', type || 'boolean');

  const item = db.prepare('SELECT * FROM check_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.get('/:id/items', (req, res) => {
  const items = db.prepare('SELECT * FROM check_items WHERE checkpoint_id = ? ORDER BY id').all(req.params.id);
  res.json(items);
});

module.exports = router;
