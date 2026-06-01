require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 60917;

app.use(cors({
  origin: 'http://127.0.0.1:50917',
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, region FROM users').all();
  res.json(users);
});

app.get('/api/users/:role', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, region FROM users WHERE role = ?').all(req.params.role);
  res.json(users);
});

app.get('/api/hospitals', (req, res) => {
  const hospitals = db.prepare('SELECT * FROM hospitals').all();
  res.json(hospitals);
});

app.post('/api/hospitals', (req, res) => {
  const { name, level, province, city, address } = req.body;
  const id = 'hosp' + Date.now();
  db.prepare('INSERT INTO hospitals (id, name, level, province, city, address) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, level, province, city, address);
  const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(id);
  res.json(hospital);
});

app.get('/api/departments', (req, res) => {
  const { hospital_id } = req.query;
  let sql = 'SELECT d.*, h.name as hospital_name FROM departments d LEFT JOIN hospitals h ON d.hospital_id = h.id';
  const params = [];
  if (hospital_id) {
    sql += ' WHERE d.hospital_id = ?';
    params.push(hospital_id);
  }
  const departments = db.prepare(sql).all(...params);
  res.json(departments);
});

app.post('/api/departments', (req, res) => {
  const { hospital_id, name, specialty } = req.body;
  const id = 'dept' + Date.now();
  db.prepare('INSERT INTO departments (id, hospital_id, name, specialty) VALUES (?, ?, ?, ?)')
    .run(id, hospital_id, name, specialty);
  const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  res.json(department);
});

app.get('/api/doctors', (req, res) => {
  const { hospital_id, compliance_status } = req.query;
  let sql = `
    SELECT d.*, h.name as hospital_name, dept.name as department_name 
    FROM doctors d 
    LEFT JOIN hospitals h ON d.hospital_id = h.id 
    LEFT JOIN departments dept ON d.department_id = dept.id
  `;
  const params = [];
  const conditions = [];
  if (hospital_id) {
    conditions.push('d.hospital_id = ?');
    params.push(hospital_id);
  }
  if (compliance_status) {
    conditions.push('d.compliance_status = ?');
    params.push(compliance_status);
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  const doctors = db.prepare(sql).all(...params);
  res.json(doctors);
});

app.get('/api/doctors/:id', (req, res) => {
  const doctor = db.prepare(`
    SELECT d.*, h.name as hospital_name, dept.name as department_name 
    FROM doctors d 
    LEFT JOIN hospitals h ON d.hospital_id = h.id 
    LEFT JOIN departments dept ON d.department_id = dept.id
    WHERE d.id = ?
  `).get(req.params.id);
  
  const visitStats = db.prepare(`
    SELECT 
      COUNT(*) as total_visits,
      COUNT(CASE WHEN visit_date >= date('now', 'start of month') THEN 1 END) as month_visits
    FROM visit_records 
    WHERE doctor_id = ?
  `).get(req.params.id);
  
  res.json({ ...doctor, ...visitStats });
});

app.post('/api/doctors', (req, res) => {
  const { name, gender, title, specialty, hospital_id, department_id, phone, email, compliance_status, visit_frequency_limit, preferences, is_restricted, restricted_reason, created_by } = req.body;
  const id = 'doc' + Date.now();
  db.prepare(`
    INSERT INTO doctors (id, name, gender, title, specialty, hospital_id, department_id, phone, email, compliance_status, visit_frequency_limit, preferences, is_restricted, restricted_reason, created_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, gender, title, specialty, hospital_id, department_id, phone, email, compliance_status || 'normal', visit_frequency_limit || 4, preferences, is_restricted ? 1 : 0, restricted_reason, created_by);
  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(id);
  res.json(doctor);
});

app.put('/api/doctors/:id', (req, res) => {
  const { name, gender, title, specialty, hospital_id, department_id, phone, email, compliance_status, visit_frequency_limit, preferences, is_restricted, restricted_reason } = req.body;
  db.prepare(`
    UPDATE doctors SET 
      name = ?, gender = ?, title = ?, specialty = ?, hospital_id = ?, department_id = ?, 
      phone = ?, email = ?, compliance_status = ?, visit_frequency_limit = ?, 
      preferences = ?, is_restricted = ?, restricted_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, gender, title, specialty, hospital_id, department_id, phone, email, compliance_status, visit_frequency_limit, preferences, is_restricted ? 1 : 0, restricted_reason, req.params.id);
  const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  res.json(doctor);
});

app.get('/api/visit-plans', (req, res) => {
  const { representative_id, doctor_id, status, start_date, end_date } = req.query;
  let sql = `
    SELECT vp.*, u.name as representative_name, d.name as doctor_name, h.name as hospital_name
    FROM visit_plans vp 
    LEFT JOIN users u ON vp.representative_id = u.id 
    LEFT JOIN doctors d ON vp.doctor_id = d.id
    LEFT JOIN hospitals h ON d.hospital_id = h.id
  `;
  const params = [];
  const conditions = [];
  if (representative_id) {
    conditions.push('vp.representative_id = ?');
    params.push(representative_id);
  }
  if (doctor_id) {
    conditions.push('vp.doctor_id = ?');
    params.push(doctor_id);
  }
  if (status) {
    conditions.push('vp.status = ?');
    params.push(status);
  }
  if (start_date) {
    conditions.push('vp.visit_date >= ?');
    params.push(start_date);
  }
  if (end_date) {
    conditions.push('vp.visit_date <= ?');
    params.push(end_date);
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY vp.visit_date DESC, vp.visit_time DESC';
  const plans = db.prepare(sql).all(...params);
  res.json(plans);
});

app.post('/api/visit-plans/check', (req, res) => {
  const { representative_id, doctor_id, visit_date, visit_time } = req.body;
  const warnings = [];
  
  const doctor = db.prepare('SELECT compliance_status, visit_frequency_limit, is_restricted FROM doctors WHERE id = ?').get(doctor_id);
  if (doctor) {
    if (doctor.is_restricted) {
      warnings.push({ type: 'error', message: '该医生处于禁访状态' });
    }
    
    const monthVisits = db.prepare(`
      SELECT COUNT(*) as count FROM visit_records 
      WHERE doctor_id = ? AND strftime('%Y-%m', visit_date) = strftime('%Y-%m', ?)
    `).get(doctor_id, visit_date).count;
    
    if (monthVisits >= doctor.visit_frequency_limit) {
      warnings.push({ type: 'warning', message: `本月已拜访${monthVisits}次，达到频率限制` });
    }
  }
  
  const conflict = db.prepare(`
    SELECT COUNT(*) as count FROM visit_plans 
    WHERE representative_id = ? AND visit_date = ? AND visit_time = ? AND status != 'cancelled'
  `).get(representative_id, visit_date, visit_time).count;
  
  if (conflict > 0) {
    warnings.push({ type: 'error', message: '该时间段已有其他拜访计划' });
  }
  
  res.json({ valid: warnings.filter(w => w.type === 'error').length === 0, warnings });
});

app.post('/api/visit-plans', (req, res) => {
  const { representative_id, doctor_id, visit_date, visit_time, visit_type, purpose } = req.body;
  const id = 'plan' + Date.now();
  db.prepare(`
    INSERT INTO visit_plans (id, representative_id, doctor_id, visit_date, visit_time, visit_type, purpose) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, representative_id, doctor_id, visit_date, visit_time, visit_type, purpose);
  const plan = db.prepare('SELECT * FROM visit_plans WHERE id = ?').get(id);
  res.json(plan);
});

app.put('/api/visit-plans/:id/reschedule', (req, res) => {
  const { visit_date, visit_time, reschedule_reason } = req.body;
  const plan = db.prepare('SELECT visit_date as original_date FROM visit_plans WHERE id = ?').get(req.params.id);
  db.prepare(`
    UPDATE visit_plans SET 
      visit_date = ?, visit_time = ?, is_rescheduled = 1, reschedule_reason = ?, original_date = ?
    WHERE id = ?
  `).run(visit_date, visit_time, reschedule_reason, plan.original_date, req.params.id);
  const updated = db.prepare('SELECT * FROM visit_plans WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.put('/api/visit-plans/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE visit_plans SET status = ? WHERE id = ?').run(status, req.params.id);
  const plan = db.prepare('SELECT * FROM visit_plans WHERE id = ?').get(req.params.id);
  res.json(plan);
});

app.get('/api/visit-records', (req, res) => {
  const { representative_id, doctor_id, start_date, end_date } = req.query;
  let sql = `
    SELECT vr.*, u.name as representative_name, d.name as doctor_name, h.name as hospital_name
    FROM visit_records vr 
    LEFT JOIN users u ON vr.representative_id = u.id 
    LEFT JOIN doctors d ON vr.doctor_id = d.id
    LEFT JOIN hospitals h ON d.hospital_id = h.id
  `;
  const params = [];
  const conditions = [];
  if (representative_id) {
    conditions.push('vr.representative_id = ?');
    params.push(representative_id);
  }
  if (doctor_id) {
    conditions.push('vr.doctor_id = ?');
    params.push(doctor_id);
  }
  if (start_date) {
    conditions.push('vr.visit_date >= ?');
    params.push(start_date);
  }
  if (end_date) {
    conditions.push('vr.visit_date <= ?');
    params.push(end_date);
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY vr.visit_date DESC, vr.checkin_time DESC';
  const records = db.prepare(sql).all(...params);
  res.json(records);
});

app.get('/api/visit-records/:id', (req, res) => {
  const record = db.prepare(`
    SELECT vr.*, u.name as representative_name, d.name as doctor_name, h.name as hospital_name
    FROM visit_records vr 
    LEFT JOIN users u ON vr.representative_id = u.id 
    LEFT JOIN doctors d ON vr.doctor_id = d.id
    LEFT JOIN hospitals h ON d.hospital_id = h.id
    WHERE vr.id = ?
  `).get(req.params.id);
  res.json(record);
});

app.post('/api/visit-records', (req, res) => {
  const { plan_id, representative_id, doctor_id, visit_date, checkin_time, checkout_time, location_lat, location_lng, location_address, discussion_topics, materials_used, feedback, follow_up_tasks } = req.body;
  const id = 'rec' + Date.now();
  db.prepare(`
    INSERT INTO visit_records (id, plan_id, representative_id, doctor_id, visit_date, checkin_time, checkout_time, location_lat, location_lng, location_address, discussion_topics, materials_used, feedback, follow_up_tasks) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, plan_id, representative_id, doctor_id, visit_date, checkin_time, checkout_time, location_lat, location_lng, location_address, discussion_topics, materials_used, feedback, follow_up_tasks);
  
  if (plan_id) {
    db.prepare('UPDATE visit_plans SET status = ? WHERE id = ?').run('completed', plan_id);
  }
  
  checkCompliance(id, representative_id, doctor_id, visit_date, location_lat, location_lng, materials_used);
  
  const record = db.prepare('SELECT * FROM visit_records WHERE id = ?').get(id);
  res.json(record);
});

function checkCompliance(record_id, rep_id, doctor_id, visit_date, lat, lng, materials) {
  const risks = [];
  
  const monthVisits = db.prepare(`
    SELECT COUNT(*) as count FROM visit_records 
    WHERE doctor_id = ? AND strftime('%Y-%m', visit_date) = strftime('%Y-%m', ?)
  `).get(doctor_id, visit_date).count;
  
  const doctor = db.prepare('SELECT visit_frequency_limit FROM doctors WHERE id = ?').get(doctor_id);
  if (doctor && monthVisits > doctor.visit_frequency_limit) {
    risks.push({ type: 'over_frequency', level: 'high', desc: `本月拜访${monthVisits}次，超出频率限制` });
  }
  
  if (!lat || !lng) {
    risks.push({ type: 'location_abnormal', level: 'medium', desc: '拜访位置信息缺失' });
  }
  
  if (materials) {
    const materialList = JSON.parse(materials);
    const sensitiveMats = materialList.filter(m => m.is_sensitive);
    if (sensitiveMats.length > 0) {
      risks.push({ type: 'sensitive_material', level: 'medium', desc: `使用了${sensitiveMats.length}份敏感资料` });
    }
  }
  
  const insertRisk = db.prepare(`
    INSERT INTO compliance_reviews (id, visit_record_id, risk_type, risk_level, description) 
    VALUES (?, ?, ?, ?, ?)
  `);
  risks.forEach(risk => {
    insertRisk.run('risk' + Date.now() + Math.random(), record_id, risk.type, risk.level, risk.desc);
  });
}

app.get('/api/materials', (req, res) => {
  const materials = db.prepare('SELECT * FROM materials').all();
  res.json(materials);
});

app.post('/api/materials', (req, res) => {
  const { name, type, category, is_sensitive, description } = req.body;
  const id = 'mat' + Date.now();
  db.prepare(`
    INSERT INTO materials (id, name, type, category, is_sensitive, description) 
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, type, category, is_sensitive ? 1 : 0, description);
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
  res.json(material);
});

app.get('/api/compliance-reviews', (req, res) => {
  const { status, risk_level } = req.query;
  let sql = `
    SELECT cr.*, vr.visit_date, u.name as representative_name, d.name as doctor_name
    FROM compliance_reviews cr 
    LEFT JOIN visit_records vr ON cr.visit_record_id = vr.id
    LEFT JOIN users u ON vr.representative_id = u.id
    LEFT JOIN doctors d ON vr.doctor_id = d.id
  `;
  const params = [];
  const conditions = [];
  if (status) {
    conditions.push('cr.status = ?');
    params.push(status);
  }
  if (risk_level) {
    conditions.push('cr.risk_level = ?');
    params.push(risk_level);
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY cr.created_at DESC';
  const reviews = db.prepare(sql).all(...params);
  res.json(reviews);
});

app.put('/api/compliance-reviews/:id', (req, res) => {
  const { status, reviewer_id, review_notes } = req.body;
  db.prepare(`
    UPDATE compliance_reviews SET status = ?, reviewer_id = ?, review_notes = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, reviewer_id, review_notes, req.params.id);
  const review = db.prepare('SELECT * FROM compliance_reviews WHERE id = ?').get(req.params.id);
  res.json(review);
});

app.get('/api/reports/dashboard', (req, res) => {
  const totalDoctors = db.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
  const totalPlans = db.prepare('SELECT COUNT(*) as count FROM visit_plans').get().count;
  const totalRecords = db.prepare('SELECT COUNT(*) as count FROM visit_records').get().count;
  const pendingRisks = db.prepare('SELECT COUNT(*) as count FROM compliance_reviews WHERE status = ?').get('pending').count;
  
  const visitByDate = db.prepare(`
    SELECT visit_date as date, COUNT(*) as count 
    FROM visit_records 
    WHERE visit_date >= date('now', '-30 days')
    GROUP BY visit_date 
    ORDER BY visit_date
  `).all();
  
  const visitByRep = db.prepare(`
    SELECT u.name as name, COUNT(*) as count 
    FROM visit_records vr 
    LEFT JOIN users u ON vr.representative_id = u.id 
    GROUP BY vr.representative_id
  `).all();
  
  const riskByType = db.prepare(`
    SELECT risk_type as type, COUNT(*) as count 
    FROM compliance_reviews 
    GROUP BY risk_type
  `).all();
  
  res.json({
    totalDoctors,
    totalPlans,
    totalRecords,
    pendingRisks,
    visitByDate,
    visitByRep,
    riskByType
  });
});

app.get('/api/reports/manager-view', (req, res) => {
  const { region, start_date, end_date } = req.query;
  
  const repStats = db.prepare(`
    SELECT 
      u.id, u.name,
      COUNT(DISTINCT vp.id) as planned_visits,
      COUNT(DISTINCT vr.id) as completed_visits,
      COUNT(DISTINCT CASE WHEN cr.status = 'pending' THEN cr.id END) as pending_risks
    FROM users u
    LEFT JOIN visit_plans vp ON u.id = vp.representative_id
    LEFT JOIN visit_records vr ON u.id = vr.representative_id
    LEFT JOIN compliance_reviews cr ON vr.id = cr.visit_record_id
    WHERE u.role = 'representative'
    GROUP BY u.id
  `).all();
  
  const doctorCompliance = db.prepare(`
    SELECT 
      d.id, d.name, h.name as hospital_name,
      COUNT(vr.id) as visit_count,
      d.visit_frequency_limit
    FROM doctors d
    LEFT JOIN hospitals h ON d.hospital_id = h.id
    LEFT JOIN visit_records vr ON d.id = vr.doctor_id
    GROUP BY d.id
  `).all();
  
  res.json({ repStats, doctorCompliance });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});

module.exports = app;
