const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();
  const { status } = req.query;
  
  let sql = `
    SELECT oa.*, d.name as department_name
    FROM outbreak_alerts oa
    LEFT JOIN departments d ON oa.department_id = d.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND oa.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY oa.created_at DESC';
  
  const alerts = db.prepare(sql).all(...params);
  res.json(alerts);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const alertId = req.params.id;
  
  const alert = db.prepare(`
    SELECT oa.*, d.name as department_name, u.name as handled_by_name
    FROM outbreak_alerts oa
    LEFT JOIN departments d ON oa.department_id = d.id
    LEFT JOIN users u ON oa.handled_by = u.id
    WHERE oa.id = ?
  `).get(alertId);
  
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  
  const cases = db.prepare(`
    SELECT ic.*, p.name as patient_name, p.mrn, d.name as department_name
    FROM outbreak_alert_cases oac
    JOIN infection_cases ic ON oac.case_id = ic.id
    JOIN patients p ON ic.patient_id = p.id
    LEFT JOIN departments d ON ic.department_id = d.id
    WHERE oac.alert_id = ?
  `).all(alertId);
  
  res.json({ ...alert, cases });
});

router.post('/:id/handle', (req, res) => {
  const db = getDb();
  const alertId = req.params.id;
  const { investigation_notes, control_measures, status } = req.body;
  
  const result = db.prepare(`
    UPDATE outbreak_alerts 
    SET investigation_notes = ?, control_measures = ?, status = ?, 
        handled_by = 2, handled_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(investigation_notes, control_measures, status || 'handled', alertId);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  
  res.json({ success: true });
});

module.exports = router;
