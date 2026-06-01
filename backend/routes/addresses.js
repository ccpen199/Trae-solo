import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(req.user.id);
  res.json(addresses);
});

router.post('/', (req, res) => {
  const { province, city, district, street, detail, contact_name, contact_phone, is_default } = req.body;
  if (!province || !city || !district || !contact_name || !contact_phone) {
    return res.status(400).json({ error: '省份、城市、区县、联系人和联系电话不能为空' });
  }

  const insert = db.transaction(() => {
    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }
    const result = db.prepare(`
      INSERT INTO addresses (user_id, province, city, district, street, detail, contact_name, contact_phone, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, province, city, district, street || null, detail || null, contact_name, contact_phone, is_default ? 1 : 0);
    return result;
  });

  try {
    const result = insert();
    const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(address);
  } catch (err) {
    res.status(500).json({ error: '添加地址失败' });
  }
});

router.put('/:id', (req, res) => {
  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!address) {
    return res.status(404).json({ error: '地址不存在' });
  }

  const { province, city, district, street, detail, contact_name, contact_phone, is_default } = req.body;

  const update = db.transaction(() => {
    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }
    db.prepare(`
      UPDATE addresses SET province = ?, city = ?, district = ?, street = ?, detail = ?,
        contact_name = ?, contact_phone = ?, is_default = ?
      WHERE id = ?
    `).run(
      province || address.province,
      city || address.city,
      district || address.district,
      street !== undefined ? street : address.street,
      detail !== undefined ? detail : address.detail,
      contact_name || address.contact_name,
      contact_phone || address.contact_phone,
      is_default ? 1 : address.is_default,
      req.params.id
    );
  });

  try {
    update();
    const updated = db.prepare('SELECT * FROM addresses WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新地址失败' });
  }
});

router.delete('/:id', (req, res) => {
  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!address) {
    return res.status(404).json({ error: '地址不存在' });
  }

  db.prepare('DELETE FROM addresses WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

export default router;
