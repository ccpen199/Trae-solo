const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/:caseId/records', (req, res) => {
  const records = db.prepare(`
    SELECT * FROM investigation_records
    WHERE case_id = ? ORDER BY visit_time DESC
  `).all(req.params.caseId);
  res.json(records);
});

router.post('/:caseId/records', (req, res) => {
  const { visit_time, investigator, visit_location, content } = req.body;
  
  const result = db.prepare(`
    INSERT INTO investigation_records (case_id, visit_time, investigator, visit_location, content)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.caseId, visit_time, investigator, visit_location, content);
  
  db.prepare("UPDATE cases SET status = 'investigating', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(req.params.caseId);
  
  res.json({ id: result.lastInsertRowid, message: '走访记录添加成功' });
});

router.get('/:caseId/related-persons', (req, res) => {
  const persons = db.prepare(`
    SELECT * FROM related_persons WHERE case_id = ?
  `).all(req.params.caseId);
  res.json(persons);
});

router.post('/:caseId/related-persons', (req, res) => {
  const { name, phone, relation, description } = req.body;
  
  const result = db.prepare(`
    INSERT INTO related_persons (case_id, name, phone, relation, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.caseId, name, phone, relation, description);
  
  res.json({ id: result.lastInsertRowid, message: '关联人员添加成功' });
});

router.get('/:caseId/risk-assessments', (req, res) => {
  const assessments = db.prepare(`
    SELECT * FROM risk_assessments WHERE case_id = ? ORDER BY assessment_time DESC
  `).all(req.params.caseId);
  res.json(assessments);
});

router.post('/:caseId/risk-assessments', (req, res) => {
  const { assessor, risk_level, assessment_content, escalation_required } = req.body;
  
  const result = db.prepare(`
    INSERT INTO risk_assessments (case_id, assessor, risk_level, assessment_content, escalation_required)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.caseId, assessor, risk_level, assessment_content, escalation_required ? 1 : 0);
  
  db.prepare(`
    UPDATE cases SET risk_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(risk_level, req.params.caseId);
  
  res.json({ id: result.lastInsertRowid, message: '风险评估添加成功' });
});

router.delete('/records/:id', (req, res) => {
  db.prepare('DELETE FROM investigation_records WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.delete('/related-persons/:id', (req, res) => {
  db.prepare('DELETE FROM related_persons WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
