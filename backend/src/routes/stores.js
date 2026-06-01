const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const stores = db.prepare('SELECT * FROM stores ORDER BY id').all();
  res.json(stores);
});

router.get('/:id', (req, res) => {
  const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(req.params.id);
  if (!store) return res.status(404).json({ error: '门店不存在' });
  res.json(store);
});

router.post('/', (req, res) => {
  try {
    const { name, address, phone } = req.body;
    if (!name) {
      return res.status(400).json({ error: '门店名称不能为空' });
    }
    const result = db.prepare('INSERT INTO stores (name, address, phone) VALUES (?, ?, ?)').run(name, address || '', phone || '');
    res.json({ id: result.lastInsertRowid, name, address, phone });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, address, phone } = req.body;
  db.prepare('UPDATE stores SET name = ?, address = ?, phone = ? WHERE id = ?').run(name, address, phone, req.params.id);
  res.json({ id: req.params.id, name, address, phone });
});

router.delete('/:id', (req, res) => {
  const storeId = req.params.id;
  db.prepare('UPDATE vehicles SET store_id = NULL WHERE store_id = ?').run(storeId);
  db.prepare('DELETE FROM stores WHERE id = ?').run(storeId);
  res.json({ success: true });
});

module.exports = router;
