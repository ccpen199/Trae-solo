const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { logOperation, logException, validatePermission } = require('../middleware/audit');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { audit_id, status, risk_level } = req.query;
    let sql = `
      SELECT r.*, a.title as audit_title, rule.name as rule_name
      FROM risks r
      LEFT JOIN audits a ON r.audit_id = a.id
      LEFT JOIN rules rule ON r.rule_id = rule.id
      WHERE 1=1
    `;
    const params = [];
    
    if (audit_id) {
      sql += ' AND r.audit_id = ?';
      params.push(audit_id);
    }
    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (risk_level) {
      sql += ' AND r.risk_level = ?';
      params.push(risk_level);
    }
    sql += ' ORDER BY r.created_at DESC';
    
    const risks = db.prepare(sql).all(...params);
    res.json({ success: true, data: risks });
  } catch (error) {
    logException(null, null, 'get_risks', req.query, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const risk = db.prepare(`
      SELECT r.*, a.title as audit_title, rule.name as rule_name,
             detector.name as detected_by_name, confirmer.name as confirmed_by_name
      FROM risks r
      LEFT JOIN audits a ON r.audit_id = a.id
      LEFT JOIN rules rule ON r.rule_id = rule.id
      LEFT JOIN users detector ON r.detected_by = detector.id
      LEFT JOIN users confirmer ON r.confirmed_by = confirmer.id
      WHERE r.id = ?
    `).get(req.params.id);
    
    if (!risk) {
      return res.status(404).json({ success: false, error: '风险记录不存在' });
    }
    
    const materials = db.prepare(`
      SELECT m.* FROM audit_materials am
      JOIN materials m ON am.material_id = m.id
      WHERE am.audit_id = ?
    `).all(risk.audit_id);
    
    const rectifications = db.prepare('SELECT * FROM rectifications WHERE risk_id = ?').all(req.params.id);
    const logs = db.prepare(`
      SELECT ol.*, u.name as user_name
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      WHERE ol.risk_id = ?
      ORDER BY ol.created_at DESC
    `).all(req.params.id);
    
    res.json({ success: true, data: { ...risk, materials, rectifications, logs } });
  } catch (error) {
    logException(null, req.params.id, 'get_risk', req.params, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/confirm', (req, res) => {
  try {
    const { user_id, is_false_positive } = req.body;
    const riskId = req.params.id;
    
    const permissionCheck = validatePermission(user_id || 1, 'auditor');
    if (!permissionCheck.valid) {
      return res.status(403).json({ success: false, error: permissionCheck.reason });
    }
    
    const risk = db.prepare('SELECT * FROM risks WHERE id = ?').get(riskId);
    const oldStatus = risk.status;
    const newStatus = is_false_positive ? 'false_positive' : 'confirmed';
    
    db.prepare(`
      UPDATE risks 
      SET status = ?, confirmed_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, parseInt(user_id) || 1, riskId);
    
    logOperation(parseInt(user_id) || 1, 'confirm_risk', { 
      riskId, 
      oldStatus, 
      newStatus,
      is_false_positive
    });
    
    const updated = db.prepare('SELECT * FROM risks WHERE id = ?').get(riskId);
    res.json({ success: true, data: updated });
  } catch (error) {
    logException(null, req.params.id, 'confirm_risk', req.body, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
