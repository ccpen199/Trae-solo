const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { type, page = 1, pageSize = 50 } = req.query;
  const offset = (page - 1) * pageSize;

  let query = 'SELECT * FROM products';
  let countQuery = 'SELECT COUNT(*) as total FROM products';
  const params = [];

  if (type) {
    query += ' WHERE type = ?';
    countQuery += ' WHERE type = ?';
    params.push(type);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), offset);

  const products = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));

  res.json({ data: products, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: '产品不存在' });
  }
  res.json(product);
});

router.post('/', (req, res) => {
  const { type, name, brand, model, price, stock, description } = req.body;

  if (!type || !name || price === undefined) {
    return res.status(400).json({ error: '类型、名称和价格必填' });
  }

  const result = db.prepare(`
    INSERT INTO products (type, name, brand, model, price, stock, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(type, name, brand || null, model || null, price, stock || 0, description || null);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

router.put('/:id', (req, res) => {
  const { type, name, brand, model, price, stock, description } = req.body;

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: '产品不存在' });
  }

  db.prepare(`
    UPDATE products
    SET type = ?, name = ?, brand = ?, model = ?, price = ?, stock = ?, description = ?
    WHERE id = ?
  `).run(type || product.type, name || product.name, brand || product.brand, model || product.model,
        price !== undefined ? price : product.price, stock !== undefined ? stock : product.stock,
        description !== undefined ? description : product.description, req.params.id);

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: '产品不存在' });
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
