const express = require('express');
const dayjs = require('dayjs');
const { getDb } = require('../db');

const router = express.Router();

const MAX_MONTHLY_HOURS = 174;
const MIN_REST_HOURS = 12;
const MAX_CONSECUTIVE_DAYS = 6;

function checkVacationConflict(db, crewId, date) {
  const vacation = db.prepare(`
    SELECT * FROM vacations 
    WHERE crew_member_id = ? 
    AND status = 'approved'
    AND start_date <= ? 
    AND end_date >= ?
  `).get(crewId, date, date);
  return !!vacation;
}

function calculateWorkHours(db, crewId, startDate, endDate) {
  const records = db.prepare(`
    SELECT SUM(hours) as total_hours 
    FROM work_records 
    WHERE crew_member_id = ? 
    AND record_date >= ? 
    AND record_date <= ?
  `).get(crewId, startDate, endDate);
  return records.total_hours || 0;
}

function checkConsecutiveDays(db, crewId, date) {
  const assignments = db.prepare(`
    SELECT DISTINCT s.schedule_date 
    FROM schedule_assignments sa
    JOIN schedules s ON sa.schedule_id = s.id
    WHERE sa.crew_member_id = ? 
    AND s.schedule_date >= DATE(?, '-6 days')
    AND s.schedule_date <= ?
    ORDER BY s.schedule_date
  `).all(crewId, date, date);
  
  const workDates = assignments.map(a => a.schedule_date);
  let consecutiveCount = 0;
  const targetDate = dayjs(date);
  
  for (let i = 6; i >= 0; i--) {
    const checkDate = targetDate.subtract(i, 'day').format('YYYY-MM-DD');
    if (workDates.includes(checkDate)) {
      consecutiveCount++;
    } else {
      consecutiveCount = 0;
    }
  }
  
  return consecutiveCount >= MAX_CONSECUTIVE_DAYS;
}

function checkQualificationMatch(db, crewId, qualificationRequired) {
  if (!qualificationRequired) return true;
  
  const qual = db.prepare(`
    SELECT * FROM qualifications 
    WHERE crew_member_id = ? 
    AND type = ? 
    AND status = 'valid'
    AND (expiry_date IS NULL OR expiry_date >= DATE('now'))
  `).get(crewId, qualificationRequired);
  
  return !!qual;
}

function getAvailableCrew(db, position, date, qualificationRequired, excludeIds = []) {
  const crewList = db.prepare(`
    SELECT cm.* FROM crew_members cm
    WHERE cm.position = ? 
    AND cm.status = 'active'
    AND cm.health_status = 'normal'
    ${excludeIds.length ? 'AND cm.id NOT IN (' + excludeIds.map(() => '?').join(',') + ')' : ''}
  `).all(position, ...excludeIds);
  
  const available = [];
  for (const crew of crewList) {
    if (checkVacationConflict(db, crew.id, date)) continue;
    if (checkConsecutiveDays(db, crew.id, date)) continue;
    if (!checkQualificationMatch(db, crew.id, qualificationRequired)) continue;
    
    const monthStart = dayjs(date).startOf('month').format('YYYY-MM-DD');
    const monthEnd = dayjs(date).endOf('month').format('YYYY-MM-DD');
    const monthHours = calculateWorkHours(db, crew.id, monthStart, monthEnd);
    
    available.push({ ...crew, current_month_hours: monthHours });
  }
  
  available.sort((a, b) => a.current_month_hours - b.current_month_hours);
  return available;
}

router.get('/available-crew', (req, res) => {
  const db = getDb();
  const { position, date, qualification_required } = req.query;
  
  if (!position || !date) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  const available = getAvailableCrew(db, position, date, qualification_required);
  res.json(available);
});

router.post('/generate', (req, res) => {
  const db = getDb();
  const { train_id, schedule_date } = req.body;
  
  if (!train_id || !schedule_date) {
    return res.status(400).json({ error: '缺少车次或排班日期' });
  }
  
  const train = db.prepare('SELECT * FROM trains WHERE id = ?').get(train_id);
  if (!train) {
    return res.status(404).json({ error: '车次不存在' });
  }
  
  const requirements = db.prepare('SELECT * FROM position_requirements WHERE train_id = ?').all(train_id);
  if (requirements.length === 0) {
    return res.status(400).json({ error: '该车次未配置岗位需求' });
  }
  
  const assignments = [];
  const conflicts = [];
  const assignedIds = [];
  
  for (const req of requirements) {
    for (let i = 0; i < req.count; i++) {
      const available = getAvailableCrew(db, req.position, schedule_date, req.qualification_required, assignedIds);
      
      if (available.length === 0) {
        conflicts.push({
          position: req.position,
          reason: `无符合条件的${req.position}人员`
        });
      } else {
        const selected = available[0];
        assignedIds.push(selected.id);
        
        const dutyStartTime = dayjs(`${schedule_date} ${train.departure_time}`).subtract(1, 'hour').format('YYYY-MM-DD HH:mm');
        const dutyEndTime = dayjs(`${schedule_date} ${train.arrival_time}`).add(1, 'hour').format('YYYY-MM-DD HH:mm');
        const workHours = (dayjs(dutyEndTime).diff(dayjs(dutyStartTime), 'minute') / 60).toFixed(2);
        
        assignments.push({
          crew_member_id: selected.id,
          crew_name: selected.name,
          position: req.position,
          duty_start_time: dutyStartTime,
          duty_end_time: dutyEndTime,
          work_hours: parseFloat(workHours)
        });
      }
    }
  }
  
  res.json({
    train,
    schedule_date,
    assignments,
    conflicts,
    has_conflicts: conflicts.length > 0
  });
});

router.post('/confirm', (req, res) => {
  const db = getDb();
  const { train_id, schedule_date, assignments, notes } = req.body;
  
  const tx = db.transaction(() => {
    const scheduleResult = db.prepare(`
      INSERT INTO schedules (train_id, schedule_date, status, notes)
      VALUES (?, ?, 'confirmed', ?)
    `).run(train_id, schedule_date, notes || '');
    
    const scheduleId = scheduleResult.lastInsertRowid;
    
    for (const assignment of assignments) {
      db.prepare(`
        INSERT INTO schedule_assignments 
        (schedule_id, crew_member_id, position, duty_start_time, duty_end_time, work_hours, status)
        VALUES (?, ?, ?, ?, ?, ?, 'assigned')
      `).run(
        scheduleId,
        assignment.crew_member_id,
        assignment.position,
        assignment.duty_start_time,
        assignment.duty_end_time,
        assignment.work_hours
      );
      
      db.prepare(`
        INSERT INTO work_records (crew_member_id, schedule_id, record_date, work_type, hours)
        VALUES (?, ?, ?, 'duty', ?)
      `).run(assignment.crew_member_id, scheduleId, schedule_date, assignment.work_hours);
    }
    
    return scheduleId;
  });
  
  try {
    const scheduleId = tx();
    res.json({ success: true, schedule_id: scheduleId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/schedules', (req, res) => {
  const db = getDb();
  const { start_date, end_date, status } = req.query;
  
  let sql = `
    SELECT s.*, t.train_no, t.departure_station, t.arrival_station, t.departure_time, t.arrival_time
    FROM schedules s
    JOIN trains t ON s.train_id = t.id
    WHERE 1=1
  `;
  const params = [];
  
  if (start_date) {
    sql += ' AND s.schedule_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND s.schedule_date <= ?';
    params.push(end_date);
  }
  if (status) {
    sql += ' AND s.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY s.schedule_date DESC, t.departure_time';
  
  const schedules = db.prepare(sql).all(...params);
  res.json(schedules);
});

router.get('/schedules/:id', (req, res) => {
  const db = getDb();
  const schedule = db.prepare(`
    SELECT s.*, t.train_no, t.departure_station, t.arrival_station, t.departure_time, t.arrival_time
    FROM schedules s
    JOIN trains t ON s.train_id = t.id
    WHERE s.id = ?
  `).get(req.params.id);
  
  if (!schedule) {
    return res.status(404).json({ error: '排班不存在' });
  }
  
  const assignments = db.prepare(`
    SELECT sa.*, cm.name as crew_name, cm.employee_no
    FROM schedule_assignments sa
    JOIN crew_members cm ON sa.crew_member_id = cm.id
    WHERE sa.schedule_id = ?
  `).all(req.params.id);
  
  res.json({ ...schedule, assignments });
});

router.delete('/schedules/:id', (req, res) => {
  const db = getDb();
  
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM work_records WHERE schedule_id = ?').run(req.params.id);
    db.prepare('DELETE FROM schedule_assignments WHERE schedule_id = ?').run(req.params.id);
    db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
  });
  
  try {
    tx();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
