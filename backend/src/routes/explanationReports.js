const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../models/database');
const { checkPermission, logOperation } = require('../middleware/auth');

router.get('/', checkPermission('report:view'), (req, res) => {
  const { task_id, status } = req.query;
  let sql = `
    SELECT er.*, qt.task_name 
    FROM explanation_reports er 
    LEFT JOIN query_tasks qt ON er.task_id = qt.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (task_id) {
    sql += ' AND er.task_id = ?';
    params.push(task_id);
  }
  if (status) {
    sql += ' AND er.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY er.created_at DESC';
  
  const stmt = db.prepare(sql);
  const reports = stmt.all(...params);
  
  res.json({ data: reports });
});

router.get('/:id', checkPermission('report:view'), (req, res) => {
  const stmt = db.prepare(`
    SELECT er.*, qt.task_name 
    FROM explanation_reports er 
    LEFT JOIN query_tasks qt ON er.task_id = qt.id 
    WHERE er.id = ?
  `);
  const report = stmt.get(req.params.id);
  
  if (!report) {
    return res.status(404).json({ error: '报告不存在' });
  }
  
  const attachments = db.prepare('SELECT * FROM report_attachments WHERE report_id = ?').all(req.params.id);
  report.attachments = attachments;
  
  res.json({ data: report });
});

router.post('/', checkPermission('task:create'), (req, res) => {
  const { task_id, title, summary, root_cause, impact_analysis, recommendations } = req.body;
  
  if (!task_id || !title) {
    return res.status(400).json({ error: '任务ID和标题不能为空' });
  }
  
  const id = `report-${uuidv4().substr(0, 8)}`;
  const stmt = db.prepare(`
    INSERT INTO explanation_reports (id, task_id, title, summary, root_cause, impact_analysis, recommendations, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, task_id, title, summary, root_cause, impact_analysis, recommendations, req.user.id);
  
  db.prepare(`
    UPDATE query_tasks SET explanation_report_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(id, task_id);
  
  logOperation(req, 'create', 'explanation_report', id);
  res.json({ data: { id } });
});

router.put('/:id', checkPermission('task:create'), (req, res) => {
  const { title, summary, root_cause, impact_analysis, recommendations, status } = req.body;
  
  const checkStmt = db.prepare('SELECT * FROM explanation_reports WHERE id = ?');
  if (!checkStmt.get(req.params.id)) {
    return res.status(404).json({ error: '报告不存在' });
  }
  
  const stmt = db.prepare(`
    UPDATE explanation_reports 
    SET title = ?, summary = ?, root_cause = ?, impact_analysis = ?, recommendations = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(title, summary, root_cause, impact_analysis, recommendations, status || 'draft', req.params.id);
  
  logOperation(req, 'update', 'explanation_report', req.params.id);
  res.json({ data: { id: req.params.id } });
});

router.post('/:id/review', checkPermission('task:review'), (req, res) => {
  const { action, comments } = req.body;
  
  const report = db.prepare('SELECT * FROM explanation_reports WHERE id = ?').get(req.params.id);
  if (!report) {
    return res.status(404).json({ error: '报告不存在' });
  }
  
  if (action === 'approve') {
    db.prepare(`
      UPDATE explanation_reports 
      SET status = 'reviewed', reviewed_by = ?, review_comments = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, comments || '审核通过', req.params.id);
  } else if (action === 'reject') {
    db.prepare(`
      UPDATE explanation_reports 
      SET status = 'draft', reviewed_by = ?, review_comments = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, comments || '审核退回', req.params.id);
  } else {
    return res.status(400).json({ error: '无效的审核操作' });
  }
  
  logOperation(req, 'review', 'explanation_report', req.params.id);
  res.json({ data: { success: true } });
});

router.get('/:id/export', checkPermission('report:view'), (req, res) => {
  const report = db.prepare(`
    SELECT er.*, qt.task_name, qt.created_at as task_created_at
    FROM explanation_reports er 
    LEFT JOIN query_tasks qt ON er.task_id = qt.id 
    WHERE er.id = ?
  `).get(req.params.id);
  
  if (!report) {
    return res.status(404).json({ error: '报告不存在' });
  }
  
  const result = db.prepare('SELECT * FROM result_tables WHERE task_id = ?').get(report.task_id);
  const anomalies = result ? db.prepare('SELECT * FROM anomaly_records WHERE result_table_id = ?').all(result.id) : [];
  const workflow = db.prepare('SELECT * FROM task_workflow_logs WHERE task_id = ? ORDER BY created_at ASC').all(report.task_id);
  
  const exportData = {
    report,
    result: result || null,
    anomalies,
    workflow
  };
  
  res.json({ data: exportData });
});

module.exports = router;
