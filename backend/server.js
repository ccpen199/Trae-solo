require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58918;

app.use(cors({
  origin: ['http://127.0.0.1:48918', 'http://localhost:48918', 'http://127.0.0.1:48918', 'http://localhost:48918'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/pathways', (req, res) => {
  const { status } = req.query;
  let sql = `SELECT * FROM pathways`;
  let params = [];
  if (status) {
    sql += ` WHERE status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY created_at DESC`;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/pathways/:id', (req, res) => {
  db.get(`SELECT * FROM pathways WHERE id = ?`, [req.params.id], (err, pathway) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!pathway) return res.status(404).json({ error: 'Pathway not found' });
    db.all(`SELECT * FROM pathway_drugs WHERE pathway_id = ?`, [req.params.id], (err, drugs) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ...pathway, drugs });
    });
  });
});

app.post('/api/pathways', (req, res) => {
  const { name, disease, stage, description, version, created_by } = req.body;
  const stmt = db.prepare(`
    INSERT INTO pathways (name, disease, stage, description, version, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(name, disease, stage, description, version, created_by || 'system', function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Pathway created successfully' });
  });
  stmt.finalize();
});

app.post('/api/pathways/:id/drugs', (req, res) => {
  const { drug_name, dosage, frequency, duration, route, contraindications, adjustment_conditions, notes } = req.body;
  const stmt = db.prepare(`
    INSERT INTO pathway_drugs (pathway_id, drug_name, dosage, frequency, duration, route, contraindications, adjustment_conditions, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(req.params.id, drug_name, dosage, frequency, duration, route, contraindications, adjustment_conditions, notes, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Drug added successfully' });
  });
  stmt.finalize();
});

app.put('/api/pathways/:id/publish', (req, res) => {
  const { reviewed_by } = req.body;
  db.run(`
    UPDATE pathways SET status = 'published', reviewed_by = ?, published_at = CURRENT_TIMESTAMP WHERE id = ?
  `, [reviewed_by || 'system', req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Pathway published successfully' });
  });
});

app.get('/api/patients', (req, res) => {
  db.all(`SELECT * FROM patients ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/patients/:id', (req, res) => {
  db.get(`SELECT * FROM patients WHERE id = ?`, [req.params.id], (err, patient) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  });
});

app.post('/api/patients', (req, res) => {
  const { name, gender, age, medical_record_no, diagnosis, allergy_history, liver_function, kidney_function, lab_results } = req.body;
  const stmt = db.prepare(`
    INSERT INTO patients (name, gender, age, medical_record_no, diagnosis, allergy_history, liver_function, kidney_function, lab_results)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(name, gender, age, medical_record_no, diagnosis, allergy_history, liver_function, kidney_function, lab_results, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Patient created successfully' });
  });
  stmt.finalize();
});

app.get('/api/patient-pathways', (req, res) => {
  db.all(`
    SELECT pp.*, p.name as patient_name, p.medical_record_no, pw.name as pathway_name, pw.disease, pw.version
    FROM patient_pathways pp
    JOIN patients p ON pp.patient_id = p.id
    JOIN pathways pw ON pp.pathway_id = pw.id
    ORDER BY pp.created_at DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/patient-pathways', (req, res) => {
  const { patient_id, pathway_id, risk_factors, concurrent_medications, created_by } = req.body;
  const stmt = db.prepare(`
    INSERT INTO patient_pathways (patient_id, pathway_id, risk_factors, concurrent_medications, created_by)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(patient_id, pathway_id, risk_factors, concurrent_medications, created_by || 'system', function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Patient pathway created successfully' });
  });
  stmt.finalize();
});

app.get('/api/patient-pathways/:id', (req, res) => {
  db.get(`
    SELECT pp.*, p.name as patient_name, p.gender, p.age, p.medical_record_no, p.allergy_history, 
           p.liver_function, p.kidney_function, p.diagnosis,
           pw.name as pathway_name, pw.disease, pw.stage, pw.version
    FROM patient_pathways pp
    JOIN patients p ON pp.patient_id = p.id
    JOIN pathways pw ON pp.pathway_id = pw.id
    WHERE pp.id = ?
  `, [req.params.id], (err, patientPathway) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!patientPathway) return res.status(404).json({ error: 'Patient pathway not found' });
    db.all(`SELECT * FROM pathway_drugs WHERE pathway_id = ?`, [patientPathway.pathway_id], (err, drugs) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ...patientPathway, pathway_drugs: drugs });
    });
  });
});

app.get('/api/orders', (req, res) => {
  const { patient_pathway_id, approval_status } = req.query;
  let sql = `
    SELECT o.*, p.name as patient_name, pw.name as pathway_name
    FROM orders o
    JOIN patient_pathways pp ON o.patient_pathway_id = pp.id
    JOIN patients p ON pp.patient_id = p.id
    JOIN pathways pw ON pp.pathway_id = pw.id
  `;
  let params = [];
  let conditions = [];
  if (patient_pathway_id) {
    conditions.push(`o.patient_pathway_id = ?`);
    params.push(patient_pathway_id);
  }
  if (approval_status) {
    conditions.push(`o.approval_status = ?`);
    params.push(approval_status);
  }
  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ');
  }
  sql += ` ORDER BY o.created_at DESC`;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/orders', (req, res) => {
  const { patient_pathway_id, drug_name, dosage, frequency, duration, doctor_id, doctor_name, is_off_pathway, doctor_note } = req.body;
  const stmt = db.prepare(`
    INSERT INTO orders (patient_pathway_id, drug_name, dosage, frequency, duration, doctor_id, doctor_name, is_off_pathway, doctor_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(patient_pathway_id, drug_name, dosage, frequency, duration, doctor_id || 'D001', doctor_name || '李医生', is_off_pathway ? 1 : 0, doctor_note, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Order created successfully' });
  });
  stmt.finalize();
});

app.put('/api/orders/:id/review', (req, res) => {
  const { approval_status, pharmacist_comment, pharmacist_id } = req.body;
  db.run(`
    UPDATE orders SET approval_status = ?, pharmacist_comment = ?, pharmacist_id = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [approval_status, pharmacist_comment, pharmacist_id || 'P001', req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Order reviewed successfully' });
  });
});

app.get('/api/adverse-events', (req, res) => {
  db.all(`
    SELECT ae.*, p.name as patient_name, pw.name as pathway_name
    FROM adverse_events ae
    JOIN patient_pathways pp ON ae.patient_pathway_id = pp.id
    JOIN patients p ON pp.patient_id = p.id
    JOIN pathways pw ON pp.pathway_id = pw.id
    ORDER BY ae.created_at DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/adverse-events', (req, res) => {
  const { patient_pathway_id, event_type, severity, description, drug_name, onset_date, outcome, reporter } = req.body;
  const stmt = db.prepare(`
    INSERT INTO adverse_events (patient_pathway_id, event_type, severity, description, drug_name, onset_date, outcome, reporter)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(patient_pathway_id, event_type, severity, description, drug_name, onset_date, outcome, reporter || 'system', function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Adverse event recorded successfully' });
  });
  stmt.finalize();
});

app.get('/api/efficacy-feedback', (req, res) => {
  db.all(`
    SELECT ef.*, p.name as patient_name, pw.name as pathway_name
    FROM efficacy_feedback ef
    JOIN patient_pathways pp ON ef.patient_pathway_id = pp.id
    JOIN patients p ON pp.patient_id = p.id
    JOIN pathways pw ON pp.pathway_id = pw.id
    ORDER BY ef.created_at DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/efficacy-feedback', (req, res) => {
  const { patient_pathway_id, feedback_type, description, outcome, created_by } = req.body;
  const stmt = db.prepare(`
    INSERT INTO efficacy_feedback (patient_pathway_id, feedback_type, description, outcome, created_by)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(patient_pathway_id, feedback_type, description, outcome, created_by || 'system', function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Feedback recorded successfully' });
  });
  stmt.finalize();
});

app.get('/api/quality-control/summary', (req, res) => {
  db.get(`SELECT COUNT(*) as total_pathways FROM pathways`, (err, pathways) => {
    db.get(`SELECT COUNT(*) as total_patients FROM patients`, (err, patients) => {
      db.get(`SELECT COUNT(*) as active_pathways FROM patient_pathways WHERE status = 'active'`, (err, activePathways) => {
        db.get(`SELECT COUNT(*) as pending_orders FROM orders WHERE approval_status = 'pending'`, (err, pendingOrders) => {
          db.get(`SELECT COUNT(*) as adverse_events FROM adverse_events`, (err, adverseEvents) => {
            db.all(`SELECT approval_status, COUNT(*) as count FROM orders GROUP BY approval_status`, (err, orderStats) => {
              db.all(`SELECT severity, COUNT(*) as count FROM adverse_events GROUP BY severity`, (err, eventStats) => {
                res.json({
                  total_pathways: pathways.total_pathways,
                  total_patients: patients.total_patients,
                  active_pathways: activePathways.active_pathways,
                  pending_orders: pendingOrders.pending_orders,
                  adverse_events: adverseEvents.adverse_events,
                  order_stats: orderStats,
                  event_stats: eventStats
                });
              });
            });
          });
        });
      });
    });
  });
});

app.get('/api/audit-logs', (req, res) => {
  db.all(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/audit-logs', (req, res) => {
  const { action, module, record_id, user_id, details } = req.body;
  const stmt = db.prepare(`
    INSERT INTO audit_logs (action, module, record_id, user_id, details)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(action, module, record_id, user_id || 'system', details, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
  stmt.finalize();
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
  console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
});

module.exports = app;
