const express = require('express');
const db = require('../database/db');
const { logException } = require('../middleware/audit');

const router = express.Router();

router.get('/dashboard', (req, res) => {
  try {
    const auditStats = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM audits
      GROUP BY status
    `).all();
    
    const riskStats = db.prepare(`
      SELECT 
        status,
        risk_level,
        COUNT(*) as count
      FROM risks
      GROUP BY status, risk_level
    `).all();
    
    const rectStats = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM rectifications
      GROUP BY status
    `).all();
    
    const overdueRects = db.prepare(`
      SELECT COUNT(*) as count
      FROM rectifications
      WHERE status NOT IN ('approved', 'rejected')
        AND due_date < DATE('now')
    `).get();
    
    const recentAudits = db.prepare(`
      SELECT a.*, u.name as assignee_name
      FROM audits a
      LEFT JOIN users u ON a.assignee_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all();
    
    res.json({ 
      success: true, 
      data: {
        auditStats,
        riskStats,
        rectStats,
        overdueCount: overdueRects.count,
        recentAudits
      }
    });
  } catch (error) {
    logException(null, null, 'get_dashboard', req.query, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/export/audits', (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const audits = db.prepare(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.status,
        a.risk_count,
        assignee.name as assignee_name,
        creator.name as creator_name,
        a.created_at,
        a.updated_at
      FROM audits a
      LEFT JOIN users assignee ON a.assignee_id = assignee.id
      LEFT JOIN users creator ON a.created_by = creator.id
      ORDER BY a.created_at DESC
    `).all();
    
    const detailedAudits = audits.map(audit => {
      const risks = db.prepare(`
        SELECT r.*, rule.name as rule_name
        FROM risks r
        LEFT JOIN rules rule ON r.rule_id = rule.id
        WHERE r.audit_id = ?
      `).all(audit.id);
      
      const rectifications = db.prepare(`
        SELECT rec.*, u.name as assignee_name
        FROM rectifications rec
        LEFT JOIN users u ON rec.assignee_id = u.id
        WHERE rec.audit_id = ?
      `).all(audit.id);
      
      return { ...audit, risks, rectifications };
    });
    
    res.json({ 
      success: true, 
      data: detailedAudits,
      exportTime: new Date().toISOString()
    });
  } catch (error) {
    logException(null, null, 'export_audits', req.query, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/exceptions', (req, res) => {
  try {
    const { is_resolved } = req.query;
    let sql = `
      SELECT e.*, u.name as handled_by_name
      FROM exceptions e
      LEFT JOIN users u ON e.handled_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (is_resolved !== undefined) {
      sql += ' AND e.is_resolved = ?';
      params.push(is_resolved === 'true' ? 1 : 0);
    }
    sql += ' ORDER BY e.created_at DESC';
    
    const exceptions = db.prepare(sql).all(...params);
    res.json({ success: true, data: exceptions });
  } catch (error) {
    logException(null, null, 'get_exceptions', req.query, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/exceptions/:id/resolve', (req, res) => {
  try {
    const { user_id, manual_note, compensation_action } = req.body;
    
    db.prepare(`
      UPDATE exceptions 
      SET is_resolved = 1, 
          handled_by = ?, 
          manual_note = ?,
          compensation_action = COALESCE(?, compensation_action),
          resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      parseInt(user_id) || 1,
      manual_note || '',
      compensation_action || null,
      req.params.id
    );
    
    const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: exception });
  } catch (error) {
    logException(null, null, 'resolve_exception', req.body, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
