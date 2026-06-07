import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const addresses = db.prepare('SELECT * FROM address_book WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(userId);
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { user_id, name, phone, province, city, district, address, is_default } = req.body;

    if (!user_id || !name || !phone || !province || !city || !district || !address) {
      return res.status(400).json({ error: '请填写完整的地址信息' });
    }

    if (is_default) {
      db.prepare('UPDATE address_book SET is_default = 0 WHERE user_id = ?').run(user_id);
    }

    const stmt = db.prepare(`
      INSERT INTO address_book (user_id, name, phone, province, city, district, address, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(user_id, name, phone, province, city, district, address, is_default ? 1 : 0);

    const addr = db.prepare('SELECT * FROM address_book WHERE id = ?').get(result.lastInsertRowid);
    res.json(addr);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, province, city, district, address, is_default } = req.body;

    const addr = db.prepare('SELECT * FROM address_book WHERE id = ?').get(id);
    if (!addr) {
      return res.status(404).json({ error: '地址不存在' });
    }

    if (is_default) {
      db.prepare('UPDATE address_book SET is_default = 0 WHERE user_id = ?').run(addr.user_id);
    }

    const stmt = db.prepare(`
      UPDATE address_book
      SET name = ?, phone = ?, province = ?, city = ?, district = ?, address = ?, is_default = ?
      WHERE id = ?
    `);
    stmt.run(name, phone, province, city, district, address, is_default ? 1 : 0, id);

    const updated = db.prepare('SELECT * FROM address_book WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const addr = db.prepare('SELECT * FROM address_book WHERE id = ?').get(id);
    if (!addr) {
      return res.status(404).json({ error: '地址不存在' });
    }

    db.prepare('DELETE FROM address_book WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
