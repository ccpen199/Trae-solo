import { Router } from 'express';
import { getDB } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const { item_id, category, keyword, page = 1, pageSize = 20 } = req.query;
    const db = getDB();
    const conditions = [];
    const params = [];

    if (item_id) {
      conditions.push('m.item_id = ?');
      params.push(item_id);
    }
    if (category) {
      conditions.push('m.category = ?');
      params.push(category);
    }
    if (keyword) {
      conditions.push('(m.name LIKE ? OR m.code LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM materials m ${where}`).get(...params).cnt;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(`
      SELECT m.*, si.name as item_name
      FROM materials m
      LEFT JOIN service_items si ON m.item_id = si.id
      ${where}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', roleMiddleware('admin', 'super_admin'), (req, res) => {
  try {
    const { name, code, item_id, category, is_required, description, template_path, sample_path, format_requirement, source_channel } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: '名称和编码不能为空' });
    }

    const db = getDB();
    const result = db.prepare(`
      INSERT INTO materials (name, code, item_id, category, is_required, description, template_path, sample_path, format_requirement, source_channel)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, code, item_id || null, category || 'paper', is_required !== undefined ? is_required : 1,
      description || null, template_path || null, sample_path || null, format_requirement || null, source_channel || null);

    res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: '材料编码已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = getDB();
    const existing = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '材料不存在' });
    }

    const { name, category, is_required, description, template_path, sample_path, format_requirement, source_channel } = req.body;

    db.prepare(`
      UPDATE materials SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        is_required = COALESCE(?, is_required),
        description = COALESCE(?, description),
        template_path = COALESCE(?, template_path),
        sample_path = COALESCE(?, sample_path),
        format_requirement = COALESCE(?, format_requirement),
        source_channel = COALESCE(?, source_channel)
      WHERE id = ?
    `).run(name || null, category || null, is_required !== undefined ? is_required : null,
      description || null, template_path || null, sample_path || null,
      format_requirement || null, source_channel || null, req.params.id);

    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
