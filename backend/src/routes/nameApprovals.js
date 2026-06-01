const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  const approvals = db.prepare(`
    SELECT a.*, r.registration_region, c.name as client_name
    FROM name_approvals a
    LEFT JOIN registration_requirements r ON a.requirement_id = r.id
    LEFT JOIN clients c ON r.client_id = c.id
    ORDER BY a.created_at DESC
  `).all();
  
  approvals.forEach(a => {
    if (a.alternative_names) {
      a.alternative_names = JSON.parse(a.alternative_names);
    }
  });
  
  res.json(approvals);
});

router.get('/requirement/:requirementId', (req, res) => {
  const approval = db.prepare(`
    SELECT * FROM name_approvals WHERE requirement_id = ?
  `).get(req.params.requirementId);
  
  if (approval) {
    if (approval.alternative_names) {
      approval.alternative_names = JSON.parse(approval.alternative_names);
    }
    
    const history = db.prepare(`
      SELECT * FROM name_approval_history WHERE approval_id = ? ORDER BY submission_number DESC
    `).all(approval.id);
    
    history.forEach(h => {
      if (h.submitted_names) {
        h.submitted_names = JSON.parse(h.submitted_names);
      }
    });
    
    approval.history = history;
  }
  
  res.json(approval || null);
});

router.post('/', (req, res) => {
  const { requirement_id, alternative_names, assigned_officer } = req.body;
  
  if (!requirement_id || !alternative_names || !alternative_names.length) {
    return res.status(400).json({ error: '需求ID和备选字号为必填项' });
  }
  
  const result = db.prepare(`
    INSERT INTO name_approvals (requirement_id, alternative_names, assigned_officer, submitted_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).run(requirement_id, JSON.stringify(alternative_names), assigned_officer || null);
  
  const approvalId = result.lastInsertRowid;
  
  db.prepare(`
    INSERT INTO name_approval_history (approval_id, submission_number, submitted_names)
    VALUES (?, 1, ?)
  `).run(approvalId, JSON.stringify(alternative_names));
  
  const approval = db.prepare('SELECT * FROM name_approvals WHERE id = ?').get(approvalId);
  if (approval.alternative_names) {
    approval.alternative_names = JSON.parse(approval.alternative_names);
  }
  
  res.status(201).json(approval);
});

router.post('/:id/resubmit', (req, res) => {
  const { alternative_names, submitted_by } = req.body;
  
  if (!alternative_names || !alternative_names.length) {
    return res.status(400).json({ error: '备选字号为必填项' });
  }
  
  const approval = db.prepare('SELECT * FROM name_approvals WHERE id = ?').get(req.params.id);
  if (!approval) {
    return res.status(404).json({ error: '核准记录不存在' });
  }
  
  const newSubmissionCount = approval.submission_count + 1;
  
  db.prepare(`
    UPDATE name_approvals SET
      alternative_names = ?, submission_count = ?, status = 'pending',
      rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP, submitted_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(JSON.stringify(alternative_names), newSubmissionCount, req.params.id);
  
  db.prepare(`
    INSERT INTO name_approval_history (approval_id, submission_number, submitted_names, submitted_by)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, newSubmissionCount, JSON.stringify(alternative_names), submitted_by || null);
  
  const updatedApproval = db.prepare('SELECT * FROM name_approvals WHERE id = ?').get(req.params.id);
  if (updatedApproval.alternative_names) {
    updatedApproval.alternative_names = JSON.parse(updatedApproval.alternative_names);
  }
  
  res.json(updatedApproval);
});

router.put('/:id/result', (req, res) => {
  const { approval_result, approved_name, rejection_reason } = req.body;
  
  const approval = db.prepare('SELECT * FROM name_approvals WHERE id = ?').get(req.params.id);
  if (!approval) {
    return res.status(404).json({ error: '核准记录不存在' });
  }
  
  const status = approval_result === 'approved' ? 'approved' : 'rejected';
  
  db.prepare(`
    UPDATE name_approvals SET
      approval_result = ?, approved_name = ?, rejection_reason = ?,
      status = ?, approved_at = ${approval_result === 'approved' ? 'CURRENT_TIMESTAMP' : 'NULL'},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(approval_result, approved_name || null, rejection_reason || null, status, req.params.id);
  
  const updatedApproval = db.prepare('SELECT * FROM name_approvals WHERE id = ?').get(req.params.id);
  if (updatedApproval.alternative_names) {
    updatedApproval.alternative_names = JSON.parse(updatedApproval.alternative_names);
  }
  
  res.json(updatedApproval);
});

module.exports = router;
