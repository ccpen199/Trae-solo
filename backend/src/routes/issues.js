const express = require('express');
const db = require('../models/database');
const dayjs = require('dayjs');

const router = express.Router();

router.get('/', (req, res) => {
  const { specialty, building, status, responsible_org_id, overdue } = req.query;
  
  let sql = `
    SELECT i.*, 
           o.name as responsible_org_name,
           u.name as creator_name,
           CASE 
             WHEN i.due_date IS NOT NULL AND i.status NOT IN ('closed', 'draft') 
               AND datetime('now') > i.due_date THEN 1 
             ELSE 0 
           END as is_overdue
    FROM issues i
    LEFT JOIN organizations o ON i.responsible_org_id = o.id
    LEFT JOIN users u ON i.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (specialty) {
    sql += ' AND i.specialty = ?';
    params.push(specialty);
  }
  if (building) {
    sql += ' AND i.building = ?';
    params.push(building);
  }
  if (status) {
    sql += ' AND i.status = ?';
    params.push(status);
  }
  if (responsible_org_id) {
    sql += ' AND i.responsible_org_id = ?';
    params.push(responsible_org_id);
  }
  if (overdue === 'true') {
    sql += ' AND i.due_date IS NOT NULL AND i.status NOT IN ("closed", "draft") AND datetime("now") > i.due_date';
  }

  sql += ' ORDER BY i.created_at DESC';

  const issues = db.prepare(sql).all(...params);
  res.json(issues);
});

router.get('/:id', (req, res) => {
  const issue = db.prepare(`
    SELECT i.*, 
           o.name as responsible_org_name,
           u.name as creator_name
    FROM issues i
    LEFT JOIN organizations o ON i.responsible_org_id = o.id
    LEFT JOIN users u ON i.created_by = u.id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!issue) {
    return res.status(404).json({ error: '问题不存在' });
  }

  const flow = db.prepare(`
    SELECT f.*, 
           from_o.name as from_org_name,
           to_o.name as to_org_name,
           u.name as operator_name
    FROM issue_flow f
    LEFT JOIN organizations from_o ON f.from_org_id = from_o.id
    LEFT JOIN organizations to_o ON f.to_org_id = to_o.id
    LEFT JOIN users u ON f.operator_id = u.id
    WHERE f.issue_id = ?
    ORDER BY f.created_at ASC
  `).all(req.params.id);

  res.json({ ...issue, flow });
});

router.post('/', (req, res) => {
  const { title, description, model_location, floor, building, specialty, 
          issue_type, severity, screenshot, drawing_version, 
          responsible_org_id, due_date } = req.body;

  if (!title) {
    return res.status(400).json({ error: '问题标题不能为空' });
  }

  if (!model_location && !floor) {
    return res.status(400).json({ error: '请补充定位信息（模型位置或楼层）' });
  }

  const status = responsible_org_id ? 'assigned' : 'pending';

  const stmt = db.prepare(`
    INSERT INTO issues (
      title, description, model_location, floor, building, specialty,
      issue_type, severity, screenshot, drawing_version,
      responsible_org_id, due_date, created_by, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    title, description, model_location, floor, building, specialty,
    issue_type, severity, screenshot, drawing_version,
    responsible_org_id, due_date, 1, status
  );

  const issueId = result.lastInsertRowid;

  db.prepare(`
    INSERT INTO issue_flow (issue_id, action, comment, operator_id)
    VALUES (?, 'create', '创建问题', 1)
  `).run(issueId);

  if (responsible_org_id) {
    db.prepare(`
      INSERT INTO issue_flow (issue_id, action, comment, to_org_id, operator_id)
      VALUES (?, 'assign', '创建时已派发', ?, 1)
    `).run(issueId, responsible_org_id);
  }

  res.json({ id: issueId, message: '创建成功' });
});

router.put('/:id/assign', (req, res) => {
  const { responsible_org_id, due_date, comment } = req.body;
  
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: '问题不存在' });
  }

  db.prepare(`
    UPDATE issues 
    SET responsible_org_id = ?, due_date = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(responsible_org_id, due_date, req.params.id);

  db.prepare(`
    INSERT INTO issue_flow (issue_id, action, comment, to_org_id, operator_id)
    VALUES (?, 'assign', ?, ?, 1)
  `).run(req.params.id, comment || '派发问题', responsible_org_id);

  res.json({ message: '派发成功' });
});

router.put('/:id/reassign', (req, res) => {
  const { responsible_org_id, comment } = req.body;
  
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: '问题不存在' });
  }

  db.prepare(`
    UPDATE issues 
    SET responsible_org_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(responsible_org_id, req.params.id);

  db.prepare(`
    INSERT INTO issue_flow (issue_id, action, comment, from_org_id, to_org_id, operator_id)
    VALUES (?, 'reassign', ?, ?, ?, 1)
  `).run(req.params.id, comment || '转派问题', issue.responsible_org_id, responsible_org_id);

  res.json({ message: '转派成功' });
});

router.put('/:id/fix', (req, res) => {
  const { comment, attachment } = req.body;
  
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: '问题不存在' });
  }

  db.prepare(`
    UPDATE issues 
    SET status = 'fixed', site_evidence = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(attachment, req.params.id);

  db.prepare(`
    INSERT INTO issue_flow (issue_id, action, comment, attachment, operator_id)
    VALUES (?, 'fix', ?, ?, 1)
  `).run(req.params.id, comment || '提交整改', attachment);

  res.json({ message: '整改提交成功' });
});

router.put('/:id/reject', (req, res) => {
  const { comment } = req.body;
  
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: '问题不存在' });
  }

  db.prepare(`
    UPDATE issues 
    SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);

  db.prepare(`
    INSERT INTO issue_flow (issue_id, action, comment, operator_id)
    VALUES (?, 'reject', ?, 1)
  `).run(req.params.id, comment || '退回整改');

  res.json({ message: '退回成功' });
});

router.put('/:id/verify', (req, res) => {
  const { passed, comment, design_response } = req.body;
  
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: '问题不存在' });
  }

  const newStatus = passed ? 'verified' : 'reopened';
  
  db.prepare(`
    UPDATE issues 
    SET status = ?, design_response = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, design_response, req.params.id);

  db.prepare(`
    INSERT INTO issue_flow (issue_id, action, comment, operator_id)
    VALUES (?, ?, ?, 1)
  `).run(req.params.id, passed ? 'verify_pass' : 'verify_fail', comment || (passed ? '复验通过' : '复验不通过'));

  res.json({ message: passed ? '复验通过' : '复验不通过，已退回' });
});

router.put('/:id/close', (req, res) => {
  const { comment } = req.body;
  
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: '问题不存在' });
  }

  db.prepare(`
    UPDATE issues 
    SET status = 'closed', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);

  db.prepare(`
    INSERT INTO issue_flow (issue_id, action, comment, operator_id)
    VALUES (?, 'close', ?, 1)
  `).run(req.params.id, comment || '关闭问题');

  res.json({ message: '关闭成功' });
});

router.get('/stats/summary', (req, res) => {
  const stats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM issues
    GROUP BY status
  `).all();

  const overdue = db.prepare(`
    SELECT COUNT(*) as count
    FROM issues
    WHERE due_date IS NOT NULL 
      AND status NOT IN ('closed', 'draft') 
      AND datetime('now') > due_date
  `).get();

  const byOrg = db.prepare(`
    SELECT 
      o.name,
      o.id,
      COUNT(i.id) as count
    FROM organizations o
    LEFT JOIN issues i ON o.id = i.responsible_org_id
    GROUP BY o.id
  `).all();

  const bySpecialty = db.prepare(`
    SELECT 
      specialty,
      COUNT(*) as count
    FROM issues
    WHERE specialty IS NOT NULL
    GROUP BY specialty
  `).all();

  res.json({
    byStatus: stats,
    overdue: overdue.count,
    byOrg,
    bySpecialty
  });
});

module.exports = router;
