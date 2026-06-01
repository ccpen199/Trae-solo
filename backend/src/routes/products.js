import express from 'express';
import db from '../models/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products);
});

router.post('/', (req, res) => {
  const { code, name, description } = req.body;
  const result = db.prepare(`
    INSERT INTO products (code, name, description)
    VALUES (?, ?, ?)
  `).run(code, name, description);
  res.json({ id: result.lastInsertRowid, message: 'Product created successfully' });
});

router.put('/:id', (req, res) => {
  const { code, name, description } = req.body;
  db.prepare(`
    UPDATE products 
    SET code = ?, name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(code, name, description, req.params.id);
  res.json({ message: 'Product updated successfully' });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Product deleted successfully' });
});

export default router;
