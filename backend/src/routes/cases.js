const express = require('express');
const db = require('../database');
const { authenticateToken, canEditCase } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  let cases;
  if (req.user.role === 'client') {
    cases = db.prepare(`
      SELECT c.*, u.name as creator_name
      FROM cases c
      JOIN case_users cu ON c.id = cu.case_id
      LEFT JOIN users u ON c.created_by = u.id
      WHERE cu.user_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user.id);
  } else {
    cases = db.prepare(`
      SELECT c.*, u.name as creator_name
      FROM cases c
      LEFT JOIN users u ON c.created_by = u.id
      ORDER BY c.created_at DESC
    `).all();
  }
  res.json({ cases });
});

router.get('/:caseId', authenticateToken, (req, res) => {
  const caseData = db.prepare(`
    SELECT c.*, u.name as creator_name
    FROM cases c
    LEFT JOIN users u ON c.created_by = u.id
    WHERE c.id = ?
  `).get(req.params.caseId);

  if (!caseData) {
    return res.status(404).json({ error: '案件不存在' });
  }

  res.json({ case: caseData });
});

router.post('/', authenticateToken, canEditCase, (req, res) => {
  const { case_number, case_name, case_type, court, plaintiff, defendant, filing_date, hearing_date, description } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO cases (case_number, case_name, case_type, court, plaintiff, defendant, filing_date, hearing_date, description, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(case_number, case_name, case_type, court, plaintiff, defendant, filing_date, hearing_date, description, req.user.id);

    db.prepare(`
      INSERT INTO audit_logs (user_id, action, module, record_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, 'create', 'cases', result.lastInsertRowid, `创建案件: ${case_name}`);

    res.json({ case: { id: result.lastInsertRowid, ...req.body } });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '案件编号已存在' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:caseId', authenticateToken, canEditCase, (req, res) => {
  const { case_name, case_type, status, court, plaintiff, defendant, filing_date, hearing_date, description } = req.body;

  db.prepare(`
    UPDATE cases 
    SET case_name = ?, case_type = ?, status = ?, court = ?, plaintiff = ?, defendant = ?, filing_date = ?, hearing_date = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(case_name, case_type, status, court, plaintiff, defendant, filing_date, hearing_date, description, req.params.caseId);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, record_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'update', 'cases', req.params.caseId, `更新案件: ${case_name}`);

  res.json({ message: '案件更新成功' });
});

router.delete('/:caseId', authenticateToken, (req, res) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: '只有管理员可以删除案件' });
  }

  db.prepare('DELETE FROM cases WHERE id = ?').run(req.params.caseId);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, module, record_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, 'delete', 'cases', req.params.caseId, '删除案件');

  res.json({ message: '案件删除成功' });
});

router.get('/:caseId/users', authenticateToken, (req, res) => {
  const users = db.prepare(`
    SELECT u.*, cu.role as case_role
    FROM case_users cu
    JOIN users u ON cu.user_id = u.id
    WHERE cu.case_id = ?
  `).all(req.params.caseId);

  res.json({ users });
});

router.post('/:caseId/users', authenticateToken, (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ error: '权限不足' });
  }

  const { user_id, role } = req.body;
  
  try {
    db.prepare(`
      INSERT INTO case_users (case_id, user_id, role)
      VALUES (?, ?, ?)
    `).run(req.params.caseId, user_id, role || 'viewer');

    res.json({ message: '添加成功' });
  } catch (err) {
    res.status(400).json({ error: '用户已添加' });
  }
});

module.exports = router;
