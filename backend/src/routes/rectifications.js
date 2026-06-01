const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { logOperation, logException, validatePermission } = require('../middleware/audit');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { audit_id, risk_id, status, assignee_id } = req.query;
    let sql = `
      SELECT r.*, a.title as audit_title, risk.title as risk_title,
             u.name as assignee_name, creator.name as creator_name
      FROM rectifications r
      LEFT JOIN audits a ON r.audit_id = a.id
      LEFT JOIN risks risk ON r.risk_id = risk.id
      LEFT JOIN users u ON r.assignee_id = u.id
      LEFT JOIN users creator ON r.created_by = creator.id
      WHERE 1=1
    `;
    const params = [];
    
    if (audit_id) {
      sql += ' AND r.audit_id = ?';
      params.push(audit_id);
    }
    if (risk_id) {
      sql += ' AND r.risk_id = ?';
      params.push(risk_id);
    }
    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (assignee_id) {
      sql += ' AND r.assignee_id = ?';
      params.push(assignee_id);
    }
    sql += ' ORDER BY r.created_at DESC';
    
    const rectifications = db.prepare(sql).all(...params);
    res.json({ success: true, data: rectifications });
  } catch (error) {
    logException(null, null, 'get_rectifications', req.query, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { risk_id, audit_id, title, description, assignee_id, due_date, action_plan, created_by } = req.body;
    const id = `rect_${uuidv4().slice(0, 8)}`;
    
    const stmt = db.prepare(`
      INSERT INTO rectifications (id, risk_id, audit_id, title, description, status, assignee_id, due_date, action_plan, created_by)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      risk_id,
      audit_id,
      title,
      description,
      parseInt(assignee_id) || null,
      due_date || null,
      action_plan,
      parseInt(created_by) || 1
    );
    
    if (audit_id) {
      db.prepare("UPDATE audits SET status = 'rectifying', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(audit_id);
    }
    
    logOperation(parseInt(created_by) || 1, 'create_rectification', { 
      rectificationId: id, 
      risk_id, 
      audit_id,
      title 
    });
    
    const rectification = db.prepare('SELECT * FROM rectifications WHERE id = ?').get(id);
    res.json({ success: true, data: rectification });
  } catch (error) {
    logException(audit_id, risk_id, 'create_rectification', req.body, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const rectification = db.prepare(`
      SELECT r.*, a.title as audit_title, risk.title as risk_title,
             u.name as assignee_name, creator.name as creator_name
      FROM rectifications r
      LEFT JOIN audits a ON r.audit_id = a.id
      LEFT JOIN risks risk ON r.risk_id = risk.id
      LEFT JOIN users u ON r.assignee_id = u.id
      LEFT JOIN users creator ON r.created_by = creator.id
      WHERE r.id = ?
    `).get(req.params.id);
    
    if (!rectification) {
      return res.status(404).json({ success: false, error: '整改记录不存在' });
    }
    
    const evidences = db.prepare(`
      SELECT re.*, m.title as material_title, u.name as reviewer_name
      FROM review_evidences re
      LEFT JOIN materials m ON re.material_id = m.id
      LEFT JOIN users u ON re.reviewer_id = u.id
      WHERE re.rectification_id = ?
      ORDER BY re.created_at DESC
    `).all(req.params.id);
    
    const logs = db.prepare(`
      SELECT ol.*, u.name as user_name
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      WHERE ol.rectification_id = ?
      ORDER BY ol.created_at DESC
    `).all(req.params.id);
    
    res.json({ success: true, data: { ...rectification, evidences, logs } });
  } catch (error) {
    logException(null, null, 'get_rectification', req.params, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/start', (req, res) => {
  try {
    const { user_id } = req.body;
    const rectId = req.params.id;
    
    const rect = db.prepare('SELECT * FROM rectifications WHERE id = ?').get(rectId);
    const oldStatus = rect.status;
    
    db.prepare(`
      UPDATE rectifications 
      SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(rectId);
    
    logOperation(parseInt(user_id) || 1, 'start_rectification', { 
      rectificationId: rectId, 
      oldStatus, 
      newStatus: 'in_progress'
    });
    
    const updated = db.prepare('SELECT * FROM rectifications WHERE id = ?').get(rectId);
    res.json({ success: true, data: updated });
  } catch (error) {
    logException(null, null, 'start_rectification', req.body, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/submit', (req, res) => {
  try {
    const { user_id, completion_note, material_id } = req.body;
    const rectId = req.params.id;
    
    const rect = db.prepare('SELECT * FROM rectifications WHERE id = ?').get(rectId);
    const oldStatus = rect.status;
    
    db.prepare(`
      UPDATE rectifications 
      SET status = 'submitted', completion_note = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(completion_note || '', rectId);
    
    if (rect.audit_id) {
      db.prepare("UPDATE audits SET status = 'reviewing', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(rect.audit_id);
    }
    
    logOperation(parseInt(user_id) || 1, 'submit_rectification', { 
      rectificationId: rectId, 
      oldStatus, 
      newStatus: 'submitted'
    });
    
    const updated = db.prepare('SELECT * FROM rectifications WHERE id = ?').get(rectId);
    res.json({ success: true, data: updated });
  } catch (error) {
    logException(null, null, 'submit_rectification', req.body, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/review', (req, res) => {
  try {
    const { user_id, conclusion, review_comment, material_id } = req.body;
    const rectId = req.params.id;
    
    const permissionCheck = validatePermission(user_id || 1, 'auditor');
    if (!permissionCheck.valid) {
      return res.status(403).json({ success: false, error: permissionCheck.reason });
    }
    
    const rect = db.prepare('SELECT * FROM rectifications WHERE id = ?').get(rectId);
    const oldStatus = rect.status;
    const newStatus = conclusion === 'pass' ? 'approved' : 'rejected';
    
    db.prepare(`
      UPDATE rectifications 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, rectId);
    
    const evidenceId = `evi_${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO review_evidences (id, rectification_id, audit_id, material_id, description, reviewer_id, conclusion, review_comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      evidenceId,
      rectId,
      rect.audit_id,
      material_id || null,
      `整改复核`,
      parseInt(user_id) || 1,
      conclusion,
      review_comment || ''
    );
    
    if (conclusion === 'pass' && rect.risk_id) {
      db.prepare("UPDATE risks SET status = 'rectified', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(rect.risk_id);
    }
    
    if (rect.audit_id && conclusion === 'pass') {
      const pendingCount = db.prepare(`
        SELECT COUNT(*) as count FROM rectifications 
        WHERE audit_id = ? AND status NOT IN ('approved')
      `).get(rect.audit_id);
      
      if (pendingCount.count === 0) {
        db.prepare("UPDATE audits SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(rect.audit_id);
      }
    }
    
    logOperation(parseInt(user_id) || 1, 'review_rectification', { 
      rectificationId: rectId, 
      oldStatus, 
      newStatus,
      conclusion
    });
    
    const updated = db.prepare('SELECT * FROM rectifications WHERE id = ?').get(rectId);
    res.json({ success: true, data: updated });
  } catch (error) {
    logException(null, null, 'review_rectification', req.body, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
