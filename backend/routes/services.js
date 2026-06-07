const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

router.get('/categories', (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare('SELECT * FROM service_categories ORDER BY sort_order ASC, created_at ASC').all();
    const tree = [];
    const map = {};
    categories.forEach(c => {
      map[c.id] = { ...c, children: [] };
    });
    categories.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].children.push(map[c.id]);
      } else {
        tree.push(map[c.id]);
      }
    });
    res.json({ success: true, data: tree });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/items', (req, res) => {
  try {
    const db = getDb();
    const { page = 1, pageSize = 10, keyword, category_id, type, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push('(name LIKE ? OR code LIKE ? OR department LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (category_id) {
      conditions.push('category_id = ?');
      params.push(category_id);
    }
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const total = db.prepare(`SELECT COUNT(*) as cnt FROM service_items ${where}`).get(...params).cnt;
    const items = db.prepare(`SELECT * FROM service_items ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, parseInt(pageSize), offset);

    res.json({ success: true, data: { list: items, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/items/:id', (req, res) => {
  try {
    const db = getDb();
    const item = db.prepare('SELECT * FROM service_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: '事项不存在' });
    }
    db.prepare('UPDATE service_items SET visit_count = visit_count + 1 WHERE id = ?').run(req.params.id);
    item.visit_count += 1;
    const guide = db.prepare('SELECT * FROM service_guides WHERE service_id = ? AND is_current = 1').get(req.params.id);
    res.json({ success: true, data: { ...item, guide } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/items', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const {
      category_id, name, code, type = 'administrative', department, level = 'province',
      status = 'active', handle_scope, handle_conditions, required_materials,
      handle_flow, charge_standard, legal_basis, promise_days = 15
    } = req.body;
    if (!category_id || !name) {
      return res.status(400).json({ success: false, message: '分类和名称不能为空' });
    }
    db.prepare(`INSERT INTO service_items (id, category_id, name, code, type, department, level, status, handle_scope, handle_conditions, required_materials, handle_flow, charge_standard, legal_basis, promise_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, category_id, name, code || null, type, department || null, level, status, handle_scope || null, handle_conditions || null, required_materials || null, handle_flow || null, charge_standard || null, legal_basis || null, promise_days);
    const item = db.prepare('SELECT * FROM service_items WHERE id = ?').get(id);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/items/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM service_items WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '事项不存在' });
    }
    const fields = [];
    const params = [];
    const allowedFields = ['category_id', 'name', 'code', 'type', 'department', 'level', 'status', 'handle_scope', 'handle_conditions', 'required_materials', 'handle_flow', 'charge_standard', 'legal_basis', 'promise_days', 'actual_days', 'online_rate', 'one_done_rate'];
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) {
        fields.push(`${f} = ?`);
        params.push(req.body[f]);
      }
    });
    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(req.params.id);
      db.prepare(`UPDATE service_items SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    }
    const item = db.prepare('SELECT * FROM service_items WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/guides/:serviceId', (req, res) => {
  try {
    const db = getDb();
    const guides = db.prepare('SELECT * FROM service_guides WHERE service_id = ? ORDER BY version DESC').all(req.params.serviceId);
    res.json({ success: true, data: guides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/guides/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM service_guides WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: '指南不存在' });
    }
    const { title, content } = req.body;
    db.prepare('UPDATE service_guides SET version = version + 1, title = ?, content = ?, updated_by = ? WHERE id = ?')
      .run(title || existing.title, content || existing.content, req.user.id, req.params.id);
    const guide = db.prepare('SELECT * FROM service_guides WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: guide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
