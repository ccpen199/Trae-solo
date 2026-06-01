const express = require('express');
const { db } = require('./database');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (user && bcrypt.compareSync(password, user.password)) {
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, created_at FROM users').all();
  res.json(users);
});

router.get('/patients', (req, res) => {
  const patients = db.prepare(`
    SELECT p.*, u.name as therapist_name 
    FROM patients p 
    LEFT JOIN users u ON p.therapist_id = u.id 
    ORDER BY p.created_at DESC
  `).all();
  res.json(patients);
});

router.get('/patients/:id', (req, res) => {
  const patient = db.prepare(`
    SELECT p.*, u.name as therapist_name 
    FROM patients p 
    LEFT JOIN users u ON p.therapist_id = u.id 
    WHERE p.id = ?
  `).get(req.params.id);
  
  if (patient) {
    res.json(patient);
  } else {
    res.status(404).json({ error: '患者不存在' });
  }
});

router.post('/patients', (req, res) => {
  const { patient_no, name, gender, age, phone, diagnosis, contraindications, goals, therapist_id, training_cycle } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO patients (patient_no, name, gender, age, phone, diagnosis, contraindications, goals, therapist_id, training_cycle)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(patient_no, name, gender, age, phone, diagnosis, contraindications, goals, therapist_id, training_cycle);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/patients/:id', (req, res) => {
  const { name, gender, age, phone, diagnosis, contraindications, goals, therapist_id, training_cycle, status } = req.body;
  
  try {
    db.prepare(`
      UPDATE patients 
      SET name = ?, gender = ?, age = ?, phone = ?, diagnosis = ?, contraindications = ?, goals = ?, therapist_id = ?, training_cycle = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, gender, age, phone, diagnosis, contraindications, goals, therapist_id, training_cycle, status, req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/patients/:id/assessments', (req, res) => {
  const assessments = db.prepare(`
    SELECT a.*, u.name as assessor_name 
    FROM assessments a 
    LEFT JOIN users u ON a.assessor_id = u.id 
    WHERE a.patient_id = ? 
    ORDER BY a.created_at DESC
  `).all(req.params.id);
  res.json(assessments);
});

router.post('/assessments', (req, res) => {
  const { patient_id, scale_name, scale_version, content, score, assessor_id } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO assessments (patient_id, scale_name, scale_version, content, score, assessor_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(patient_id, scale_name, scale_version, JSON.stringify(content), score, assessor_id);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/prescriptions', (req, res) => {
  const prescriptions = db.prepare(`
    SELECT pr.*, p.name as patient_name, uc.name as creator_name, uf.name as confirmer_name 
    FROM prescriptions pr 
    LEFT JOIN patients p ON pr.patient_id = p.id 
    LEFT JOIN users uc ON pr.created_by = uc.id 
    LEFT JOIN users uf ON pr.confirmed_by = uf.id 
    ORDER BY pr.created_at DESC
  `).all().map(pr => ({
    ...pr,
    training_items: JSON.parse(pr.training_items || '[]'),
    assessment_nodes: JSON.parse(pr.assessment_nodes || '[]')
  }));
  res.json(prescriptions);
});

router.get('/patients/:id/prescriptions', (req, res) => {
  const prescriptions = db.prepare(`
    SELECT pr.*, uc.name as creator_name, uf.name as confirmer_name 
    FROM prescriptions pr 
    LEFT JOIN users uc ON pr.created_by = uc.id 
    LEFT JOIN users uf ON pr.confirmed_by = uf.id 
    WHERE pr.patient_id = ? 
    ORDER BY pr.created_at DESC
  `).all(req.params.id).map(pr => ({
    ...pr,
    training_items: JSON.parse(pr.training_items || '[]'),
    assessment_nodes: JSON.parse(pr.assessment_nodes || '[]')
  }));
  res.json(prescriptions);
});

router.post('/prescriptions', (req, res) => {
  const { patient_id, created_by, training_items, frequency, intensity, notes, assessment_nodes } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO prescriptions (patient_id, created_by, training_items, frequency, intensity, notes, assessment_nodes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      patient_id, 
      created_by, 
      JSON.stringify(training_items), 
      frequency, 
      intensity, 
      notes, 
      JSON.stringify(assessment_nodes)
    );
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/prescriptions/:id/confirm', (req, res) => {
  const { confirmed_by } = req.body;
  
  try {
    db.prepare(`
      UPDATE prescriptions 
      SET status = 'confirmed', confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(confirmed_by, req.params.id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/prescriptions/:id', (req, res) => {
  const { training_items, frequency, intensity, notes, assessment_nodes, changed_by, reason } = req.body;
  
  try {
    const old = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(req.params.id);
    
    db.prepare(`
      UPDATE prescriptions 
      SET training_items = ?, frequency = ?, intensity = ?, notes = ?, assessment_nodes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      JSON.stringify(training_items), 
      frequency, 
      intensity, 
      notes, 
      JSON.stringify(assessment_nodes), 
      req.params.id
    );
    
    if (changed_by) {
      db.prepare(`
        INSERT INTO prescription_changes (prescription_id, changed_by, change_type, old_value, new_value, reason)
        VALUES (?, ?, 'update', ?, ?, ?)
      `).run(req.params.id, changed_by, JSON.stringify(old), JSON.stringify(req.body), reason);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/training-records', (req, res) => {
  const records = db.prepare(`
    SELECT tr.*, p.name as patient_name, u.name as creator_name 
    FROM training_records tr 
    LEFT JOIN patients p ON tr.patient_id = p.id 
    LEFT JOIN users u ON tr.created_by = u.id 
    ORDER BY tr.created_at DESC
  `).all();
  res.json(records);
});

router.get('/patients/:id/training-records', (req, res) => {
  const records = db.prepare(`
    SELECT tr.*, pr.id as prescription_id, u.name as creator_name 
    FROM training_records tr 
    LEFT JOIN prescriptions pr ON tr.prescription_id = pr.id 
    LEFT JOIN users u ON tr.created_by = u.id 
    WHERE tr.patient_id = ? 
    ORDER BY tr.training_date DESC
  `).all(req.params.id);
  res.json(records);
});

router.post('/training-records', (req, res) => {
  const { prescription_id, patient_id, training_date, completion_status, pain_score, movement_quality, therapist_notes, abort_reason, created_by } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO training_records (prescription_id, patient_id, training_date, completion_status, pain_score, movement_quality, therapist_notes, abort_reason, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(prescription_id, patient_id, training_date, completion_status, pain_score, movement_quality, therapist_notes, abort_reason, created_by);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/efficacy-analyses', (req, res) => {
  const analyses = db.prepare(`
    SELECT ea.*, p.name as patient_name, u.name as analyzer_name,
           a_start.score as start_score, a_end.score as end_score
    FROM efficacy_analyses ea 
    LEFT JOIN patients p ON ea.patient_id = p.id 
    LEFT JOIN users u ON ea.analyzed_by = u.id 
    LEFT JOIN assessments a_start ON ea.start_assessment_id = a_start.id
    LEFT JOIN assessments a_end ON ea.end_assessment_id = a_end.id
    ORDER BY ea.created_at DESC
  `).all();
  res.json(analyses);
});

router.post('/efficacy-analyses', (req, res) => {
  const { patient_id, start_assessment_id, end_assessment_id, adherence_rate, goal_achievement, analysis, recommendations, analyzed_by } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO efficacy_analyses (patient_id, start_assessment_id, end_assessment_id, adherence_rate, goal_achievement, analysis, recommendations, analyzed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(patient_id, start_assessment_id, end_assessment_id, adherence_rate, goal_achievement, analysis, recommendations, analyzed_by);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/dashboard/stats', (req, res) => {
  const patientCount = db.prepare("SELECT COUNT(*) as count FROM patients WHERE status = 'active'").get();
  const prescriptionCount = db.prepare("SELECT COUNT(*) as count FROM prescriptions WHERE status = 'confirmed'").get();
  const todayTraining = db.prepare("SELECT COUNT(*) as count FROM training_records WHERE training_date = DATE('now')").get();
  const pendingPrescriptions = db.prepare("SELECT COUNT(*) as count FROM prescriptions WHERE status = 'pending'").get();
  
  res.json({
    activePatients: patientCount.count,
    activePrescriptions: prescriptionCount.count,
    todayTrainingCount: todayTraining.count,
    pendingPrescriptions: pendingPrescriptions.count
  });
});

router.get('/reports/pain-abnormal', (req, res) => {
  const records = db.prepare(`
    SELECT tr.*, p.name as patient_name 
    FROM training_records tr 
    LEFT JOIN patients p ON tr.patient_id = p.id 
    WHERE tr.pain_score >= 7 
    ORDER BY tr.created_at DESC 
    LIMIT 50
  `).all();
  res.json(records);
});

router.get('/reports/absent', (req, res) => {
  const records = db.prepare(`
    SELECT tr.*, p.name as patient_name 
    FROM training_records tr 
    LEFT JOIN patients p ON tr.patient_id = p.id 
    WHERE tr.completion_status = 'absent' 
    ORDER BY tr.created_at DESC 
    LIMIT 50
  `).all();
  res.json(records);
});

router.get('/prescriptions/:id/changes', (req, res) => {
  const changes = db.prepare(`
    SELECT pc.*, u.name as changer_name 
    FROM prescription_changes pc 
    LEFT JOIN users u ON pc.changed_by = u.id 
    WHERE pc.prescription_id = ? 
    ORDER BY pc.created_at DESC
  `).all(req.params.id);
  res.json(changes);
});

module.exports = router;
