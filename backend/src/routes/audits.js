const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { detectContent, getContext } = require('../utils/ruleEngine');
const { 
  logOperation, 
  logException, 
  validateRuleVersion,
  validatePermission,
  validatePreviousNode,
  validateRequiredMaterials
} = require('../middleware/audit');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status, assignee_id, start_date, end_date, reason } = req.query;
    let sql = `
      SELECT a.*, u.name as assignee_name, creator.name as creator_name
      FROM audits a
      LEFT JOIN users u ON a.assignee_id = u.id
      LEFT JOIN users creator ON a.created_by = creator.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (assignee_id) {
      sql += ' AND a.assignee_id = ?';
      params.push(assignee_id);
    }
    if (start_date) {
      sql += ' AND a.created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND a.created_at <= ?';
      params.push(end_date);
    }
    sql += ' ORDER BY a.created_at DESC';
    
    const audits = db.prepare(sql).all(...params);
    res.json({ success: true, data: audits });
  } catch (error) {
    logException(null, null, 'get_audits', req.query, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { title, description, assignee_id, created_by, material_ids } = req.body;
    const id = `audit_${uuidv4().slice(0, 8)}`;
    
    const permissionCheck = validatePermission(created_by || 1, 'user');
    if (!permissionCheck.valid) {
      return res.status(403).json({ success: false, error: permissionCheck.reason });
    }
    
    const stmt = db.prepare(`
      INSERT INTO audits (id, title, description, status, assignee_id, created_by)
      VALUES (?, ?, ?, 'draft', ?, ?)
    `);
    stmt.run(id, title, description, parseInt(assignee_id) || null, parseInt(created_by) || 1);
    
    if (material_ids && Array.isArray(material_ids)) {
      const linkStmt = db.prepare('INSERT OR IGNORE INTO audit_materials (audit_id, material_id) VALUES (?, ?)');
      material_ids.forEach(mid => linkStmt.run(id, mid));
    }
    
    logOperation(parseInt(created_by) || 1, 'create_audit', { auditId: id, title });
    
    const audit = db.prepare('SELECT * FROM audits WHERE id = ?').get(id);
    res.json({ success: true, data: audit });
  } catch (error) {
    logException(null, null, 'create_audit', req.body, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const audit = db.prepare(`
      SELECT a.*, u.name as assignee_name, creator.name as creator_name
      FROM audits a
      LEFT JOIN users u ON a.assignee_id = u.id
      LEFT JOIN users creator ON a.created_by = creator.id
      WHERE a.id = ?
    `).get(req.params.id);
    
    if (!audit) {
      return res.status(404).json({ success: false, error: '审计记录不存在' });
    }
    
    const materials = db.prepare(`
      SELECT m.* FROM audit_materials am
      JOIN materials m ON am.material_id = m.id
      WHERE am.audit_id = ?
    `).all(req.params.id);
    
    const risks = db.prepare(`
      SELECT r.*, rule.name as rule_name
      FROM risks r
      LEFT JOIN rules rule ON r.rule_id = rule.id
      WHERE r.audit_id = ?
    `).all(req.params.id);
    
    const rectifications = db.prepare(`
      SELECT rec.*, u.name as assignee_name
      FROM rectifications rec
      LEFT JOIN users u ON rec.assignee_id = u.id
      WHERE rec.audit_id = ?
    `).all(req.params.id);
    
    const logs = db.prepare(`
      SELECT ol.*, u.name as user_name
      FROM operation_logs ol
      LEFT JOIN users u ON ol.user_id = u.id
      WHERE ol.audit_id = ?
      ORDER BY ol.created_at DESC
    `).all(req.params.id);
    
    res.json({ 
      success: true, 
      data: { ...audit, materials, risks, rectifications, logs } 
    });
  } catch (error) {
    logException(req.params.id, null, 'get_audit', req.params, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/submit', (req, res) => {
  try {
    const { user_id } = req.body;
    const auditId = req.params.id;
    
    const permissionCheck = validatePermission(user_id || 1, 'user');
    if (!permissionCheck.valid) {
      return res.status(403).json({ success: false, error: permissionCheck.reason });
    }
    
    const materialCheck = validateRequiredMaterials(auditId, ['document']);
    if (!materialCheck.valid) {
      return res.status(400).json({ success: false, error: materialCheck.reason });
    }
    
    const audit = db.prepare('SELECT * FROM audits WHERE id = ?').get(auditId);
    const oldStatus = audit.status;
    
    db.prepare('UPDATE audits SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('pending', auditId);
    
    logOperation(parseInt(user_id) || 1, 'submit_audit', { 
      auditId, 
      oldStatus, 
      newStatus: 'pending' 
    });
    
    const updated = db.prepare('SELECT * FROM audits WHERE id = ?').get(auditId);
    res.json({ success: true, data: updated });
  } catch (error) {
    logException(auditId, null, 'submit_audit', req.body, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/run-rules', (req, res) => {
  try {
    const { user_id, rule_versions } = req.body;
    const auditId = req.params.id;
    
    const permissionCheck = validatePermission(user_id || 1, 'model_ops');
    if (!permissionCheck.valid) {
      return res.status(403).json({ success: false, error: permissionCheck.reason });
    }
    
    const previousCheck = validatePreviousNode(auditId, null);
    if (!previousCheck.valid) {
      return res.status(400).json({ success: false, error: previousCheck.reason });
    }
    
    if (rule_versions) {
      for (const [ruleId, expectedVersion] of Object.entries(rule_versions)) {
        const versionCheck = validateRuleVersion(ruleId, expectedVersion);
        if (!versionCheck.valid) {
          logException(auditId, null, 'rule_version_check', { ruleId, expectedVersion }, new Error(versionCheck.reason));
          return res.status(400).json({ success: false, error: versionCheck.reason });
        }
      }
    }
    
    const materials = db.prepare(`
      SELECT m.* FROM audit_materials am
      JOIN materials m ON am.material_id = m.id
      WHERE am.audit_id = ?
    `).all(auditId);
    
    const activeRules = db.prepare('SELECT * FROM rules WHERE is_active = 1').all();
    const detectedRisks = [];
    const matchDetails = [];
    
    for (const material of materials) {
      const textToCheck = (material.title || '') + '\n' + (material.content || '');
      
      for (const rule of activeRules) {
        const matches = detectContent(textToCheck, rule);
        
        for (const match of matches) {
          const context = getContext(textToCheck, match.index, match.length);
          const riskId = `risk_${uuidv4().slice(0, 8)}`;
          
          db.prepare(`
            INSERT INTO risks (id, audit_id, rule_id, rule_version, title, description, risk_level, location, matched_text, status, detected_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)
          `).run(
            riskId,
            auditId,
            rule.id,
            rule.version,
            `${rule.name} - ${material.title}`,
            `在材料"${material.title}"中检测到【${match.type}】：${match.description}\n匹配内容：${match.text}\n上下文：${context}`,
            rule.risk_level,
            `材料: ${material.title}, 位置: 第${match.index}字符`,
            match.text,
            parseInt(user_id) || 1
          );
          
          detectedRisks.push(riskId);
          matchDetails.push({
            riskId,
            material: material.title,
            rule: rule.name,
            matchType: match.type,
            matchedText: match.text,
            context
          });
        }
      }
    }
    
    const newStatus = detectedRisks.length > 0 ? 'risk_detected' : 'completed';
    
    db.prepare(`
      UPDATE audits 
      SET status = ?, risk_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, detectedRisks.length, auditId);
    
    logOperation(parseInt(user_id) || 1, 'run_rules', { 
      auditId, 
      detectedRisks: detectedRisks.length,
      matchDetails,
      newStatus
    });
    
    const risks = db.prepare('SELECT * FROM risks WHERE audit_id = ?').all(auditId);
    res.json({ success: true, data: { risks, matchDetails, count: detectedRisks.length } });
  } catch (error) {
    logException(req.params.id, null, 'run_rules', req.body, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/complete', (req, res) => {
  try {
    const { user_id, conclusion } = req.body;
    const auditId = req.params.id;
    
    const audit = db.prepare('SELECT * FROM audits WHERE id = ?').get(auditId);
    const oldStatus = audit.status;
    
    db.prepare(`
      UPDATE audits 
      SET status = 'completed', previous_conclusion = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(conclusion || 'pass', auditId);
    
    logOperation(parseInt(user_id) || 1, 'complete_audit', { 
      auditId, 
      oldStatus, 
      newStatus: 'completed',
      conclusion 
    });
    
    const updated = db.prepare('SELECT * FROM audits WHERE id = ?').get(auditId);
    res.json({ success: true, data: updated });
  } catch (error) {
    logException(auditId, null, 'complete_audit', req.body, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
