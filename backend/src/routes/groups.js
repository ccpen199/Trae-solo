const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/case/:caseId', authenticateToken, (req, res) => {
  const groups = db.prepare(`
    SELECT g.*, u.name as creator_name, COUNT(e.id) as evidence_count
    FROM evidence_groups g
    LEFT JOIN users u ON g.created_by = u.id
    LEFT JOIN evidence e ON g.id = e.group_id AND e.is_active = 1
    WHERE g.case_id = ?
    GROUP BY g.id
    ORDER BY g.group_order
  `).all(req.params.caseId);

  res.json({ groups });
});

router.post('/', authenticateToken, (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ error: '客户无法创建分组' });
  }

  const { case_id, group_name, description } = req.body;

  const maxOrder = db.prepare('SELECT MAX(group_order) as max FROM evidence_groups WHERE case_id = ?').get(case_id);
  const group_order = (maxOrder.max || 0) + 1;

  const result = db.prepare(`
    INSERT INTO evidence_groups (case_id, group_name, group_order, description, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(case_id, group_name, group_order, description, req.user.id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, record_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'create', 'groups', result.lastInsertRowid, `创建分组: ${group_name}`);

  res.json({ group: { id: result.lastInsertRowid, ...req.body, group_order } });
});

router.put('/:groupId', authenticateToken, (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ error: '客户无法编辑分组' });
  }

  const { group_name, description, group_order } = req.body;

  db.prepare(`
    UPDATE evidence_groups 
    SET group_name = ?, description = ?, group_order = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(group_name, description, group_order, req.params.groupId);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, record_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'update', 'groups', req.params.groupId, `更新分组: ${group_name}`);

  res.json({ message: '分组更新成功' });
});

router.delete('/:groupId', authenticateToken, (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ error: '客户无法删除分组' });
  }

  db.prepare('DELETE FROM evidence_groups WHERE id = ?').run(req.params.groupId);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, record_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'delete', 'groups', req.params.groupId, '删除分组');

  res.json({ message: '分组删除成功' });
});

module.exports = router;
