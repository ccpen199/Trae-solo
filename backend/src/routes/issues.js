const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.get('/audit/:auditPlanId', (req, res) => {
  const issues = db.prepare(`
    SELECT ai.*, cc.name as category_name
    FROM audit_issues ai
    LEFT JOIN checklist_categories cc ON ai.category_id = cc.id
    WHERE ai.audit_plan_id = ?
    ORDER BY 
      CASE ai.severity WHEN 'critical' THEN 1 WHEN 'major' THEN 2 WHEN 'minor' THEN 3 ELSE 4 END,
      ai.created_at DESC
  `).all(req.params.auditPlanId);
  res.json(issues);
});

router.post('/', (req, res) => {
  const { audit_plan_id, category_id, description, severity, responsible_person, deadline, evidence_requirement } = req.body;
  
  const result = db.prepare(
    'INSERT INTO audit_issues (audit_plan_id, category_id, description, severity, responsible_person, deadline, evidence_requirement) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(audit_plan_id, category_id, description, severity, responsible_person, deadline, evidence_requirement);
  
  res.json({ id: result.lastInsertRowid, ...req.body, status: 'open' });
});

router.put('/:id', (req, res) => {
  const { category_id, description, severity, responsible_person, deadline, evidence_requirement, status, rectification_evidence, recheck_result, recheck_by } = req.body;
  
  db.prepare(`
    UPDATE audit_issues 
    SET category_id=?, description=?, severity=?, responsible_person=?, deadline=?, evidence_requirement=?, 
        status=?, rectification_evidence=?, recheck_result=?, recheck_by=?, 
        updated_at=CURRENT_TIMESTAMP,
        recheck_at = CASE WHEN ? IS NOT NULL THEN CURRENT_TIMESTAMP ELSE recheck_at END
    WHERE id=?
  `).run(category_id, description, severity, responsible_person, deadline, evidence_requirement, 
         status || 'open', rectification_evidence, recheck_result, recheck_by, 
         recheck_result, req.params.id);
  
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM audit_issues WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/check-audit-pass/:auditPlanId', (req, res) => {
  const criticalIssues = db.prepare(`
    SELECT COUNT(*) as count 
    FROM audit_issues 
    WHERE audit_plan_id = ? AND severity = 'critical' AND status != 'closed'
  `).get(req.params.auditPlanId);
  
  res.json({
    canPass: criticalIssues.count === 0,
    openCriticalCount: criticalIssues.count
  });
});

module.exports = router;
