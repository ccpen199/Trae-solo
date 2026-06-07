import { Router } from 'express';
import { getDB } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const db = getDB();
    const list = db.prepare('SELECT * FROM departments ORDER BY id ASC').all();
    res.json({ list, total: list.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
    if (!dept) {
      return res.status(404).json({ error: '部门不存在' });
    }

    const itemCount = db.prepare('SELECT COUNT(*) as cnt FROM service_items WHERE department_id = ?').get(req.params.id).cnt;
    const caseCount = db.prepare(`
      SELECT COUNT(*) as cnt FROM cases c
      JOIN service_items si ON c.item_id = si.id
      WHERE si.department_id = ?
    `).get(req.params.id).cnt;

    res.json({ ...dept, itemCount, caseCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', roleMiddleware('admin', 'super_admin'), (req, res) => {
  try {
    const { name, code, parent_id, level, contact_phone, status } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: '部门名称和编码不能为空' });
    }

    const db = getDB();
    const result = db.prepare(`
      INSERT INTO departments (name, code, parent_id, level, contact_phone, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, code, parent_id || null, level || 1, contact_phone || null, status || 'active');

    res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: '部门编码已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', roleMiddleware('admin', 'super_admin'), (req, res) => {
  try {
    const db = getDB();
    const existing = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '部门不存在' });
    }

    const { name, code, parent_id, level, contact_phone, status } = req.body;

    db.prepare(`
      UPDATE departments SET
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        parent_id = COALESCE(?, parent_id),
        level = COALESCE(?, level),
        contact_phone = COALESCE(?, contact_phone),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(name || null, code || null, parent_id || null, level || null,
      contact_phone || null, status || null, req.params.id);

    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
