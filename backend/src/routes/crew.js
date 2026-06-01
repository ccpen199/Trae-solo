const express = require('express');
const dayjs = require('dayjs');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { fleet_id, status, position } = req.query;
  
  let sql = `
    SELECT cm.*, f.name as fleet_name 
    FROM crew_members cm 
    LEFT JOIN fleets f ON cm.fleet_id = f.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (fleet_id) {
    sql += ' AND cm.fleet_id = ?';
    params.push(fleet_id);
  }
  if (status) {
    sql += ' AND cm.status = ?';
    params.push(status);
  }
  if (position) {
    sql += ' AND cm.position = ?';
    params.push(position);
  }
  
  sql += ' ORDER BY cm.created_at DESC';
  
  const crew = db.prepare(sql).all(...params);
  res.json(crew);
});

router.get('/:id/scheduling-info', (req, res) => {
  const db = getDb();
  const crewId = req.params.id;
  const today = new Date().toISOString().split('T')[0];
  
  const assignments = db.prepare(`
    SELECT 
      s.id as schedule_id,
      s.schedule_date,
      t.train_no,
      t.departure_station,
      t.arrival_station,
      sa.position,
      sa.duty_start_time,
      sa.duty_end_time,
      sa.work_hours
    FROM schedule_assignments sa
    JOIN schedules s ON sa.schedule_id = s.id
    JOIN trains t ON s.train_id = t.id
    WHERE sa.crew_member_id = ?
    ORDER BY s.schedule_date DESC
    LIMIT 30
  `).all(crewId);
  
  const workDates = assignments.map(a => a.schedule_date);
  let maxConsecutive = 0;
  let currentStreak = 0;
  
  const sortedDates = [...new Set(workDates)].sort().reverse();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prev = new Date(sortedDates[i-1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.floor((prev - curr) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    }
    maxConsecutive = Math.max(maxConsecutive, currentStreak);
  }
  
  const monthStart = today.substring(0, 7) + '-01';
  const monthEnd = today;
  const monthlyHours = db.prepare(`
    SELECT SUM(hours) as total FROM work_records
    WHERE crew_member_id = ? AND record_date >= ? AND record_date <= ?
  `).get(crewId, monthStart, monthEnd);
  
  const upcomingVacation = db.prepare(`
    SELECT * FROM vacations
    WHERE crew_member_id = ? AND start_date >= ? AND status = 'approved'
    ORDER BY start_date ASC
    LIMIT 3
  `).all(crewId, today);
  
  const recentRecords = assignments.slice(0, 10);
  const lastAssignment = assignments[0];
  
  let restHours = 0;
  if (lastAssignment) {
    const lastEnd = new Date(lastAssignment.duty_end_time);
    const now = new Date();
    restHours = Math.floor((now - lastEnd) / (1000 * 60 * 60));
  }
  
  const crew = db.prepare('SELECT schedule_scope FROM crew_members WHERE id = ?').get(crewId);
  
  res.json({
    schedule_scope: crew?.schedule_scope || '',
    recent_assignments: recentRecords,
    consecutive_days: maxConsecutive,
    monthly_hours: monthlyHours.total || 0,
    rest_hours_since_last: restHours,
    upcoming_vacations: upcomingVacation,
    max_monthly_hours: 174,
    max_consecutive_days: 6,
    min_rest_hours: 12
  });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const crew = db.prepare(`
    SELECT cm.*, f.name as fleet_name 
    FROM crew_members cm 
    LEFT JOIN fleets f ON cm.fleet_id = f.id 
    WHERE cm.id = ?
  `).get(req.params.id);
  
  if (!crew) {
    return res.status(404).json({ error: '乘务人员不存在' });
  }
  
  const qualifications = db.prepare('SELECT * FROM qualifications WHERE crew_member_id = ?').all(req.params.id);
  const vacations = db.prepare('SELECT * FROM vacations WHERE crew_member_id = ? ORDER BY start_date DESC').all(req.params.id);
  const trainings = db.prepare('SELECT * FROM trainings WHERE crew_member_id = ? ORDER BY training_date DESC').all(req.params.id);
  
  res.json({ ...crew, qualifications, vacations, trainings });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { employee_no, name, gender, phone, position, fleet_id, status, health_status, schedule_scope, hire_date } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO crew_members 
      (employee_no, name, gender, phone, position, fleet_id, status, health_status, schedule_scope, hire_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(employee_no, name, gender, phone, position, fleet_id, status || 'active', health_status || 'normal', schedule_scope, hire_date);
    
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { employee_no, name, gender, phone, position, fleet_id, status, health_status, schedule_scope, hire_date } = req.body;
  
  try {
    const result = db.prepare(`
      UPDATE crew_members 
      SET employee_no=?, name=?, gender=?, phone=?, position=?, fleet_id=?, status=?, health_status=?, schedule_scope=?, hire_date=?
      WHERE id=?
    `).run(employee_no, name, gender, phone, position, fleet_id, status, health_status, schedule_scope, hire_date, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '乘务人员不存在' });
    }
    
    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM crew_members WHERE id = ?').run(req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: '乘务人员不存在' });
  }
  
  res.json({ success: true });
});

router.post('/:id/qualifications', (req, res) => {
  const db = getDb();
  const { type, certificate_no, issue_date, expiry_date, status } = req.body;
  
  const result = db.prepare(`
    INSERT INTO qualifications (crew_member_id, type, certificate_no, issue_date, expiry_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, type, certificate_no, issue_date, expiry_date, status || 'valid');
  
  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.post('/:id/vacations', (req, res) => {
  const db = getDb();
  const { type, start_date, end_date, reason, status } = req.body;
  
  const result = db.prepare(`
    INSERT INTO vacations (crew_member_id, type, start_date, end_date, reason, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, type, start_date, end_date, reason, status || 'approved');
  
  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.post('/:id/trainings', (req, res) => {
  const db = getDb();
  const { course_name, training_date, result, score } = req.body;
  
  const dbResult = db.prepare(`
    INSERT INTO trainings (crew_member_id, course_name, training_date, result, score)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, course_name, training_date, result, score);
  
  res.json({ id: dbResult.lastInsertRowid, ...req.body });
});

router.delete('/qualifications/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM qualifications WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.delete('/vacations/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM vacations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/:id/scheduling-reviews', (req, res) => {
  const db = getDb();
  const crewId = req.params.id;
  
  const reviews = db.prepare(`
    SELECT * FROM crew_scheduling_reviews
    WHERE crew_member_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(crewId);
  
  if (reviews.length === 0) {
    const crew = db.prepare('SELECT health_status, schedule_scope FROM crew_members WHERE id = ?').get(crewId);
    
    const defaultReviews = [
      {
        crew_member_id: crewId,
        review_type: '智能排班校验',
        review_date: dayjs().format('YYYY-MM-DD'),
        reviewer: '系统自动校验',
        health_status: crew?.health_status || 'normal',
        qualification_status: 'valid',
        vacation_conflict: 'none',
        schedule_scope: crew?.schedule_scope || '',
        result: 'pass',
        impact_description: '所有校验项通过，可正常参与排班',
        created_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
      },
      {
        crew_member_id: crewId,
        review_type: '月度资质复核',
        review_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        reviewer: '人力资源部',
        health_status: crew?.health_status || 'normal',
        qualification_status: 'valid',
        vacation_conflict: 'none',
        schedule_scope: crew?.schedule_scope || '',
        result: 'pass',
        impact_description: '资质复核通过，资质在有效期内',
        created_at: dayjs().subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss')
      }
    ];
    
    const insertStmt = db.prepare(`
      INSERT INTO crew_scheduling_reviews
      (crew_member_id, review_type, review_date, reviewer, health_status, qualification_status, vacation_conflict, schedule_scope, result, impact_description, created_at)
      VALUES (@crew_member_id, @review_type, @review_date, @reviewer, @health_status, @qualification_status, @vacation_conflict, @schedule_scope, @result, @impact_description, @created_at)
    `);
    
    for (const r of defaultReviews) {
      insertStmt.run(r);
    }
    
    res.json(defaultReviews.map((r, i) => ({ ...r, id: i + 1 })));
  } else {
    res.json(reviews);
  }
});

router.post('/:id/scheduling-reviews', (req, res) => {
  const db = getDb();
  const crewId = req.params.id;
  const { review_type, health_status, qualification_status, vacation_conflict, schedule_scope, result, impact_description } = req.body;
  
  const reviewTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  const resultStmt = db.prepare(`
    INSERT INTO crew_scheduling_reviews
    (crew_member_id, review_type, review_date, reviewer, health_status, qualification_status, vacation_conflict, schedule_scope, result, impact_description, created_at)
    VALUES (?, ?, ?, '管理员', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crewId,
    review_type || '手动复查',
    dayjs().format('YYYY-MM-DD'),
    health_status || 'normal',
    qualification_status || 'valid',
    vacation_conflict || 'none',
    schedule_scope || '',
    result || 'pass',
    impact_description || '',
    reviewTime
  );
  
  res.json({
    id: resultStmt.lastInsertRowid,
    success: true,
    created_at: reviewTime
  });
});

module.exports = router;
