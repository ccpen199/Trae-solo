const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();
  const { status, department_id } = req.query;
  
  let sql = `
    SELECT ic.*, p.name as patient_name, p.mrn, p.bed_no, d.name as department_name
    FROM infection_cases ic
    JOIN patients p ON ic.patient_id = p.id
    LEFT JOIN departments d ON ic.department_id = d.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND ic.status = ?';
    params.push(status);
  }
  if (department_id) {
    sql += ' AND ic.department_id = ?';
    params.push(department_id);
  }
  
  sql += ' ORDER BY ic.created_at DESC';
  
  const cases = db.prepare(sql).all(...params);
  res.json(cases);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const caseId = req.params.id;
  
  const caseData = db.prepare(`
    SELECT ic.*, p.name as patient_name, p.mrn, p.gender, p.age, p.bed_no, p.admission_date,
           d.name as department_name, u.name as confirmed_by_name
    FROM infection_cases ic
    JOIN patients p ON ic.patient_id = p.id
    LEFT JOIN departments d ON ic.department_id = d.id
    LEFT JOIN users u ON ic.confirmed_by = u.id
    WHERE ic.id = ?
  `).get(caseId);
  
  if (!caseData) {
    return res.status(404).json({ error: 'Case not found' });
  }
  
  const temperatures = db.prepare(`
    SELECT * FROM temperature_records WHERE patient_id = ? ORDER BY record_time DESC LIMIT 10
  `).all(caseData.patient_id);
  
  const labResults = db.prepare(`
    SELECT * FROM lab_results WHERE patient_id = ? ORDER BY result_date DESC
  `).all(caseData.patient_id);
  
  const antibiotics = db.prepare(`
    SELECT * FROM antibiotic_usage WHERE patient_id = ? ORDER BY start_date DESC
  `).all(caseData.patient_id);
  
  const surgeries = db.prepare(`
    SELECT * FROM surgeries WHERE patient_id = ? ORDER BY surgery_date DESC
  `).all(caseData.patient_id);
  
  const diagnoses = db.prepare(`
    SELECT * FROM diagnoses WHERE patient_id = ? ORDER BY diagnosis_date DESC
  `).all(caseData.patient_id);
  
  res.json({
    ...caseData,
    temperatures,
    labResults,
    antibiotics,
    surgeries,
    diagnoses
  });
});

router.post('/:id/confirm', (req, res) => {
  const db = getDb();
  const caseId = req.params.id;
  const { confirm_reason, infection_site, pathogen } = req.body;
  
  const result = db.prepare(`
    UPDATE infection_cases 
    SET status = 'confirmed', confirm_date = DATE('now'), confirmed_by = 2, 
        confirm_reason = ?, infection_site = ?, pathogen = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(confirm_reason, infection_site, pathogen, caseId);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Case not found' });
  }
  
  res.json({ success: true });
});

router.post('/:id/reject', (req, res) => {
  const db = getDb();
  const caseId = req.params.id;
  const { confirm_reason } = req.body;
  
  const result = db.prepare(`
    UPDATE infection_cases 
    SET status = 'rejected', confirm_date = DATE('now'), confirmed_by = 2, 
        confirm_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(confirm_reason, caseId);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Case not found' });
  }
  
  res.json({ success: true });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { patient_id, infection_site, pathogen, department_id } = req.body;
  
  if (!patient_id) {
    return res.status(400).json({ error: '患者ID不能为空' });
  }
  
  const result = db.prepare(`
    INSERT INTO infection_cases (patient_id, infection_site, pathogen, department_id, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(patient_id, infection_site, pathogen, department_id);
  
  res.json({ success: true, id: result.lastInsertRowid });
});

module.exports = router;
