const express = require('express');
const router = express.Router();
const db = require('../database');
const dayjs = require('dayjs');

router.get('/', (req, res) => {
  const { employee_id, status } = req.query;
  let sql = `
    SELECT a.*, e.name as employee_name, e.employee_no, p.position_name 
    FROM authorizations a 
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN positions p ON a.position_id = p.id
    WHERE 1=1
  `;
  const params = [];
  if (employee_id) {
    sql += ' AND a.employee_id = ?';
    params.push(employee_id);
  }
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  const authorizations = db.prepare(sql).all(...params);
  res.json({ success: true, data: authorizations });
});

router.post('/', (req, res) => {
  const { employee_id, position_id, authorization_type, applicant, reason, effective_scope, start_date, end_date, is_temporary } = req.body;
  const result = db.prepare(`
    INSERT INTO authorizations (employee_id, position_id, authorization_type, applicant, reason, effective_scope, start_date, end_date, is_temporary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(employee_id, position_id, authorization_type, applicant, reason, effective_scope, start_date, end_date, is_temporary ? 1 : 0);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.put('/:id', (req, res) => {
  const { approver, status } = req.body;
  db.prepare(`
    UPDATE authorizations SET approver = ?, status = ?
    WHERE id = ?
  `).run(approver, status, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM authorizations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/schedules', (req, res) => {
  const { schedule_date } = req.query;
  let sql = `
    SELECT s.*, e.name as employee_name, e.employee_no, p.position_name 
    FROM schedules s 
    LEFT JOIN employees e ON s.employee_id = e.id
    LEFT JOIN positions p ON s.position_id = p.id
    WHERE 1=1
  `;
  const params = [];
  if (schedule_date) {
    sql += ' AND s.schedule_date = ?';
    params.push(schedule_date);
  }
  const schedules = db.prepare(sql).all(...params);
  res.json({ success: true, data: schedules });
});

router.post('/schedules', (req, res) => {
  const { schedule_date, shift, position_id, employee_id } = req.body;
  const result = db.prepare(`
    INSERT INTO schedules (schedule_date, shift, position_id, employee_id)
    VALUES (?, ?, ?, ?)
  `).run(schedule_date, shift, position_id, employee_id);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.post('/schedules/:id/check', (req, res) => {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
  if (!schedule) {
    return res.status(404).json({ success: false, message: '排班不存在' });
  }

  const warnings = [];
  const today = dayjs().format('YYYY-MM-DD');

  const expiredCerts = db.prepare(`
    SELECT * FROM certificates 
    WHERE employee_id = ? AND expire_date < ? AND status = 'valid'
  `).all(schedule.employee_id, today);
  if (expiredCerts.length > 0) {
    warnings.push(`存在${expiredCerts.length}个过期证书`);
  }

  const failedTraining = db.prepare(`
    SELECT * FROM training_records 
    WHERE employee_id = ? AND pass_status = 'fail'
  `).all(schedule.employee_id);
  if (failedTraining.length > 0) {
    warnings.push(`存在${failedTraining.length}个未通过培训`);
  }

  const activeAuth = db.prepare(`
    SELECT * FROM authorizations 
    WHERE employee_id = ? AND position_id = ? AND status = 'approved'
    AND (end_date IS NULL OR end_date >= ?)
  `).get(schedule.employee_id, schedule.position_id, today);
  
  if (!activeAuth) {
    warnings.push('无有效上岗授权');
  }

  const checkResult = warnings.length === 0 ? 'pass' : 'warning';
  const checkNote = warnings.join('; ');

  db.prepare(`
    UPDATE schedules SET qualification_check = ?, check_note = ?
    WHERE id = ?
  `).run(checkResult, checkNote, req.params.id);

  res.json({ success: true, data: { checkResult, warnings } });
});

router.get('/audit/summary', (req, res) => {
  const today = dayjs().format('YYYY-MM-DD');
  const warningDate = dayjs().add(30, 'day').format('YYYY-MM-DD');

  const expiredCerts = db.prepare(`
    SELECT c.*, e.name, e.employee_no FROM certificates c
    JOIN employees e ON c.employee_id = e.id
    WHERE c.expire_date < ? AND c.status = 'valid'
  `).all(today);

  const expiringCerts = db.prepare(`
    SELECT c.*, e.name, e.employee_no FROM certificates c
    JOIN employees e ON c.employee_id = e.id
    WHERE c.expire_date <= ? AND c.expire_date >= ? AND c.status = 'valid'
  `).all(warningDate, today);

  const failedTraining = db.prepare(`
    SELECT tr.*, e.name, e.employee_no, tc.course_name FROM training_records tr
    JOIN employees e ON tr.employee_id = e.id
    JOIN training_courses tc ON tr.course_id = tc.id
    WHERE tr.pass_status = 'fail'
  `).all();

  const expiredAuth = db.prepare(`
    SELECT a.*, e.name, e.employee_no, p.position_name FROM authorizations a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN positions p ON a.position_id = p.id
    WHERE a.is_temporary = 1 AND a.end_date < ? AND a.status = 'approved'
  `).all(today);

  res.json({
    success: true,
    data: {
      expiredCerts,
      expiringCerts,
      failedTraining,
      expiredAuth,
      totalWarnings: expiredCerts.length + expiringCerts.length + failedTraining.length + expiredAuth.length
    }
  });
});

module.exports = router;
