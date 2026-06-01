const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../utils/db');

router.get('/reports', (req, res) => {
  const { status, report_type } = req.query;
  
  let sql = `
    SELECT r.*, 
           reporter.name as reporter_name, reporter.photo_url as reporter_photo,
           reported.name as reported_name, reported.photo_url as reported_photo,
           reported.risk_score as reported_risk_score,
           handler.username as handler_name
    FROM reports r
    JOIN profiles reporter ON reporter.id = r.reporter_profile_id
    JOIN profiles reported ON reported.id = r.reported_profile_id
    LEFT JOIN users handler ON handler.id = r.handled_by
    WHERE 1=1
  `;
  let params = [];
  
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  if (report_type) { sql += ' AND r.report_type = ?'; params.push(report_type); }
  sql += ' ORDER BY r.created_at DESC LIMIT 100';
  
  const reports = allQuery(sql, params);
  res.json({ ok: true, reports });
});

router.post('/reports', (req, res) => {
  const { reporter_profile_id, reported_profile_id, report_type, report_content, evidence } = req.body;
  
  const result = runQuery(`
    INSERT INTO reports (reporter_profile_id, reported_profile_id, report_type, report_content, evidence, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `, [reporter_profile_id, reported_profile_id, report_type, report_content, evidence || '']);
  
  runQuery('UPDATE profiles SET risk_score = risk_score + 15 WHERE id = ?', [reported_profile_id]);
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, new_value) VALUES (?, ?, ?, ?)`,
    ['create_report', 'report', result.lastInsertRowid, JSON.stringify(req.body)]);
  
  res.json({ ok: true, id: result.lastInsertRowid });
});

router.put('/reports/:id', (req, res) => {
  const { status, handled_by, handling_result } = req.body;
  
  const report = getQuery('SELECT * FROM reports WHERE id = ?', [req.params.id]);
  if (!report) return res.status(404).json({ ok: false, error: 'report_not_found' });
  
  runQuery(`UPDATE reports SET status = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP, handling_result = ? WHERE id = ?`,
    [status, handled_by || null, handling_result || '', req.params.id]);
  
  if (status === 'resolved' && handling_result?.includes('拉黑')) {
    runQuery(`INSERT INTO safety_blocks (operator_id, blocked_profile_id, reason, duration, status) VALUES (?, ?, ?, ?, 'active')`,
      [handled_by || null, report.reported_profile_id, handling_result, '30天']);
    runQuery(`UPDATE profiles SET status = 'blocked' WHERE id = ?`, [report.reported_profile_id]);
  }
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, old_value, new_value) VALUES (?, ?, ?, ?, ?)`,
    ['handle_report', 'report', req.params.id, JSON.stringify(report), JSON.stringify(req.body)]);
  
  res.json({ ok: true });
});

router.get('/blocks', (req, res) => {
  const blocks = allQuery(`
    SELECT b.*, 
           p.name as profile_name, p.photo_url as profile_photo, p.risk_score,
           handler.username as handler_name
    FROM safety_blocks b
    JOIN profiles p ON p.id = b.blocked_profile_id
    LEFT JOIN users handler ON handler.id = b.operator_id
    ORDER BY b.created_at DESC LIMIT 100
  `);
  res.json({ ok: true, blocks });
});

router.post('/blocks', (req, res) => {
  const { operator_id, blocked_profile_id, reason, duration, block_until, is_permanent } = req.body;
  
  const result = runQuery(`
    INSERT INTO safety_blocks (operator_id, blocked_profile_id, reason, duration, block_until, is_permanent, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `, [operator_id || null, blocked_profile_id, reason, duration || null, block_until || null, is_permanent ? 1 : 0]);
  
  runQuery(`UPDATE profiles SET status = 'blocked' WHERE id = ?`, [blocked_profile_id]);
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, new_value) VALUES (?, ?, ?, ?)`,
    ['create_block', 'safety_block', result.lastInsertRowid, JSON.stringify(req.body)]);
  
  res.json({ ok: true, id: result.lastInsertRowid });
});

router.put('/blocks/:id/unblock', (req, res) => {
  const { operator_id, reason } = req.body;
  
  const block = getQuery('SELECT * FROM safety_blocks WHERE id = ?', [req.params.id]);
  if (!block) return res.status(404).json({ ok: false, error: 'block_not_found' });
  
  runQuery(`UPDATE safety_blocks SET status = 'inactive' WHERE id = ?`, [req.params.id]);
  runQuery(`UPDATE profiles SET status = 'active' WHERE id = ?`, [block.blocked_profile_id]);
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, new_value) VALUES (?, ?, ?, ?)`,
    ['unblock_profile', 'safety_block', req.params.id, JSON.stringify({ operator_id, reason })]);
  
  res.json({ ok: true });
});

router.get('/fraud-risks', (req, res) => {
  const { status, risk_level } = req.query;
  
  let sql = `
    SELECT f.*, 
           p.name as profile_name, p.photo_url as profile_photo, p.real_name_verified, p.photo_verified,
           p.city, p.age, p.occupation, p.risk_score as current_risk_score,
           handler.username as handler_name
    FROM fraud_risks f
    JOIN profiles p ON p.id = f.profile_id
    LEFT JOIN users handler ON handler.id = f.handled_by
    WHERE 1=1
  `;
  let params = [];
  
  if (status) { sql += ' AND f.status = ?'; params.push(status); }
  if (risk_level) { sql += ' AND f.risk_level = ?'; params.push(risk_level); }
  sql += ' ORDER BY f.risk_score DESC, f.created_at DESC LIMIT 100';
  
  const risks = allQuery(sql, params);
  res.json({ ok: true, risks });
});

router.post('/fraud-risks', (req, res) => {
  const { profile_id, risk_type, risk_level, risk_evidence, risk_score } = req.body;
  
  const result = runQuery(`
    INSERT INTO fraud_risks (profile_id, risk_type, risk_level, risk_evidence, risk_score, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `, [profile_id, risk_type, risk_level, risk_evidence || '', risk_score || 50]);
  
  runQuery(`UPDATE profiles SET risk_score = risk_score + ? WHERE id = ?`, [risk_score || 20, profile_id]);
  
  res.json({ ok: true, id: result.lastInsertRowid });
});

router.put('/fraud-risks/:id', (req, res) => {
  const { status, handled_by, handling_result } = req.body;
  
  const risk = getQuery('SELECT * FROM fraud_risks WHERE id = ?', [req.params.id]);
  if (!risk) return res.status(404).json({ ok: false, error: 'risk_not_found' });
  
  runQuery(`UPDATE fraud_risks SET status = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP, handling_result = ? WHERE id = ?`,
    [status, handled_by || null, handling_result || '', req.params.id]);
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, old_value, new_value) VALUES (?, ?, ?, ?, ?)`,
    ['handle_fraud_risk', 'fraud_risk', req.params.id, JSON.stringify(risk), JSON.stringify(req.body)]);
  
  res.json({ ok: true });
});

router.get('/sensitive-word-logs', (req, res) => {
  const logs = allQuery(`
    SELECT s.*, 
           p.name as profile_name, p.photo_url as profile_photo,
           handler.username as handler_name,
           m.content as message_content
    FROM sensitive_word_logs s
    JOIN profiles p ON p.id = s.profile_id
    LEFT JOIN users handler ON handler.id = s.handled_by
    LEFT JOIN messages m ON m.id = s.message_id
    ORDER BY s.created_at DESC LIMIT 100
  `);
  res.json({ ok: true, logs });
});

router.put('/sensitive-word-logs/:id', (req, res) => {
  const { handled_by, handling_result } = req.body;
  runQuery(`UPDATE sensitive_word_logs SET handled_by = ?, handled_at = CURRENT_TIMESTAMP, handling_result = ? WHERE id = ?`,
    [handled_by || null, handling_result || '', req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
