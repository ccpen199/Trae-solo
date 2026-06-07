const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

router.get('/materials', (req, res) => {
  try {
    const db = getDb();
    const { page = 1, pageSize = 10, material_type, source_level } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (material_type) {
      conditions.push('material_type = ?');
      params.push(material_type);
    }
    if (source_level) {
      conditions.push('source_level = ?');
      params.push(source_level);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const total = db.prepare(`SELECT COUNT(*) as cnt FROM shared_materials ${where}`).get(...params).cnt;
    const list = db.prepare(`SELECT * FROM shared_materials ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, parseInt(pageSize), offset);

    res.json({ success: true, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/materials', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { title, material_type, source_level, source_org, file_path, shared_scope } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: '材料名称不能为空' });
    }
    const id = uuidv4();
    db.prepare(`INSERT INTO shared_materials (id, title, material_type, source_level, source_org, file_path, shared_scope, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, title, material_type || null, source_level || null, source_org || null, file_path || null, shared_scope || null, req.user.id);
    const material = db.prepare('SELECT * FROM shared_materials WHERE id = ?').get(id);
    res.json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/approvals', (req, res) => {
  try {
    const db = getDb();
    const { page = 1, pageSize = 10, status, priority } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const total = db.prepare(`SELECT COUNT(*) as cnt FROM approval_tasks ${where}`).get(...params).cnt;
    const list = db.prepare(`SELECT * FROM approval_tasks ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, parseInt(pageSize), offset);

    res.json({ success: true, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/approvals', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { title, service_id, priority = 'normal', level, due_date } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: '审批标题不能为空' });
    }
    const id = uuidv4();
    db.prepare(`INSERT INTO approval_tasks (id, title, applicant_id, service_id, current_node, status, priority, level, assigned_to, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, title, req.user.id, service_id || null, '待提交', 'pending', priority, level || 'province', null, due_date || null);
    db.prepare('INSERT INTO approval_flows (id, task_id, node_name, handler_id, handler_name, action, opinion) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), id, '提交申请', req.user.id, req.user.real_name, 'submit', '提交审批申请');
    const task = db.prepare('SELECT * FROM approval_tasks WHERE id = ?').get(id);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/approvals/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const task = db.prepare('SELECT * FROM approval_tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: '审批任务不存在' });
    }
    const { action, opinion, current_node, status, assigned_to } = req.body;
    if (current_node) {
      db.prepare('UPDATE approval_tasks SET current_node = ? WHERE id = ?').run(current_node, req.params.id);
    }
    if (status) {
      const completedAt = status === 'completed' ? new Date().toISOString() : null;
      if (completedAt) {
        db.prepare('UPDATE approval_tasks SET status = ?, completed_at = ? WHERE id = ?').run(status, completedAt, req.params.id);
      } else {
        db.prepare('UPDATE approval_tasks SET status = ? WHERE id = ?').run(status, req.params.id);
      }
    }
    if (assigned_to) {
      db.prepare('UPDATE approval_tasks SET assigned_to = ? WHERE id = ?').run(assigned_to, req.params.id);
    }
    db.prepare('INSERT INTO approval_flows (id, task_id, node_name, handler_id, handler_name, action, opinion) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), req.params.id, current_node || task.current_node, req.user.id, req.user.real_name, action || 'process', opinion || '');
    const updated = db.prepare('SELECT * FROM approval_tasks WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/approvals/:id/flows', (req, res) => {
  try {
    const db = getDb();
    const flows = db.prepare('SELECT * FROM approval_flows WHERE task_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json({ success: true, data: flows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
