const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/courses', (req, res) => {
  const courses = db.prepare('SELECT * FROM training_courses').all();
  res.json({ success: true, data: courses });
});

router.post('/courses', (req, res) => {
  const { course_code, course_name, course_type, duration, description } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO training_courses (course_code, course_name, course_type, duration, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(course_code, course_name, course_type, duration, description);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/records', (req, res) => {
  const { employee_id, course_id } = req.query;
  let sql = `
    SELECT tr.*, e.name as employee_name, tc.course_name 
    FROM training_records tr 
    JOIN employees e ON tr.employee_id = e.id
    JOIN training_courses tc ON tr.course_id = tc.id
    WHERE 1=1
  `;
  const params = [];
  if (employee_id) {
    sql += ' AND tr.employee_id = ?';
    params.push(employee_id);
  }
  if (course_id) {
    sql += ' AND tr.course_id = ?';
    params.push(course_id);
  }
  const records = db.prepare(sql).all(...params);
  res.json({ success: true, data: records });
});

router.post('/records', (req, res) => {
  const { employee_id, course_id, training_date } = req.body;
  const result = db.prepare(`
    INSERT INTO training_records (employee_id, course_id, training_date)
    VALUES (?, ?, ?)
  `).run(employee_id, course_id, training_date);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.put('/records/:id', (req, res) => {
  const { sign_in_status, score, pass_status, retake_count, instructor_rating, instructor_comment } = req.body;
  db.prepare(`
    UPDATE training_records 
    SET sign_in_status = ?, score = ?, pass_status = ?, retake_count = ?, instructor_rating = ?, instructor_comment = ?
    WHERE id = ?
  `).run(sign_in_status, score, pass_status, retake_count, instructor_rating, instructor_comment, req.params.id);
  res.json({ success: true });
});

router.get('/exams', (req, res) => {
  const { employee_id } = req.query;
  let sql = `
    SELECT ex.*, e.name as employee_name 
    FROM exams ex 
    JOIN employees e ON ex.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (employee_id) {
    sql += ' AND ex.employee_id = ?';
    params.push(employee_id);
  }
  const exams = db.prepare(sql).all(...params);
  res.json({ success: true, data: exams });
});

router.post('/exams', (req, res) => {
  const { employee_id, exam_name, exam_type, exam_date, score, pass_status } = req.body;
  const result = db.prepare(`
    INSERT INTO exams (employee_id, exam_name, exam_type, exam_date, score, pass_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(employee_id, exam_name, exam_type, exam_date, score, pass_status);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.put('/exams/:id', (req, res) => {
  const { score, pass_status, retake_count } = req.body;
  db.prepare(`
    UPDATE exams SET score = ?, pass_status = ?, retake_count = ?
    WHERE id = ?
  `).run(score, pass_status, retake_count, req.params.id);
  res.json({ success: true });
});

module.exports = router;
