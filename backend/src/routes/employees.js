const express = require('express');
const router = express.Router();
const db = require('../database');
const dayjs = require('dayjs');

router.get('/', (req, res) => {
  const { department, status } = req.query;
  let sql = `
    SELECT e.*, p.position_name 
    FROM employees e 
    LEFT JOIN positions p ON e.position_id = p.id
    WHERE 1=1
  `;
  const params = [];
  
  if (department) {
    sql += ' AND e.department = ?';
    params.push(department);
  }
  if (status) {
    sql += ' AND e.status = ?';
    params.push(status);
  }
  
  const employees = db.prepare(sql).all(...params);
  res.json({ success: true, data: employees });
});

router.get('/:id', (req, res) => {
  const employee = db.prepare(`
    SELECT e.*, p.position_name 
    FROM employees e 
    LEFT JOIN positions p ON e.position_id = p.id
    WHERE e.id = ?
  `).get(req.params.id);
  
  if (!employee) {
    return res.status(404).json({ success: false, message: '员工不存在' });
  }
  
  const certificates = db.prepare('SELECT * FROM certificates WHERE employee_id = ?').all(req.params.id);
  const skills = db.prepare('SELECT * FROM employee_skills WHERE employee_id = ?').all(req.params.id);
  const trainingRecords = db.prepare(`
    SELECT tr.*, tc.course_name 
    FROM training_records tr 
    JOIN training_courses tc ON tr.course_id = tc.id 
    WHERE tr.employee_id = ?
  `).all(req.params.id);
  const exams = db.prepare('SELECT * FROM exams WHERE employee_id = ?').all(req.params.id);
  const authorizations = db.prepare(`
    SELECT a.*, p.position_name 
    FROM authorizations a 
    LEFT JOIN positions p ON a.position_id = p.id 
    WHERE a.employee_id = ?
  `).all(req.params.id);
  
  res.json({
    success: true,
    data: {
      ...employee,
      certificates,
      skills,
      trainingRecords,
      exams,
      authorizations
    }
  });
});

router.post('/', (req, res) => {
  const { employee_no, name, gender, department, position_id, skill_level, forbidden_post } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO employees (employee_no, name, gender, department, position_id, skill_level, forbidden_post)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(employee_no, name, gender, department, position_id, skill_level || 1, forbidden_post);
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, gender, department, position_id, skill_level, status, forbidden_post } = req.body;
  
  db.prepare(`
    UPDATE employees 
    SET name = ?, gender = ?, department = ?, position_id = ?, skill_level = ?, status = ?, forbidden_post = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, gender, department, position_id, skill_level, status, forbidden_post, req.params.id);
  
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/:id/certificates/warnings', (req, res) => {
  const today = dayjs().format('YYYY-MM-DD');
  const warningDate = dayjs().add(30, 'day').format('YYYY-MM-DD');
  
  const expiringCerts = db.prepare(`
    SELECT * FROM certificates 
    WHERE employee_id = ? AND expire_date <= ? AND expire_date >= ? AND status = 'valid'
  `).all(req.params.id, warningDate, today);
  
  const expiredCerts = db.prepare(`
    SELECT * FROM certificates 
    WHERE employee_id = ? AND expire_date < ? AND status = 'valid'
  `).all(req.params.id, today);
  
  res.json({
    success: true,
    data: {
      expiring: expiringCerts,
      expired: expiredCerts
    }
  });
});

router.post('/:id/certificates', (req, res) => {
  const { certificate_type, certificate_no, issue_date, expire_date, issuer } = req.body;
  
  const result = db.prepare(`
    INSERT INTO certificates (employee_id, certificate_type, certificate_no, issue_date, expire_date, issuer)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, certificate_type, certificate_no, issue_date, expire_date, issuer);
  
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.post('/:id/skills', (req, res) => {
  const { skill_name, skill_level, acquired_date, expire_date } = req.body;
  
  const result = db.prepare(`
    INSERT INTO employee_skills (employee_id, skill_name, skill_level, acquired_date, expire_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, skill_name, skill_level || 1, acquired_date, expire_date);
  
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

module.exports = router;
