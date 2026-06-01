import { Router } from 'express';
import db from '../db/init.js';
import dayjs from 'dayjs';

const router = Router();

function checkScheduleConflict(employee_id, schedule_date, start_time, end_time, exclude_id = null) {
  const conflicts = [];
  
  const leaves = db.prepare(`
    SELECT * FROM leave_requests 
    WHERE employee_id = ? AND leave_date = ? AND status = 'approved'
  `).all(employee_id, schedule_date);
  if (leaves.length > 0) {
    conflicts.push({ type: 'leave', message: '员工当天已请假' });
  }

  let sql = `
    SELECT * FROM schedules 
    WHERE employee_id = ? AND schedule_date = ?
  `;
  const params = [employee_id, schedule_date];
  if (exclude_id) {
    sql += ' AND id != ?';
    params.push(exclude_id);
  }
  const existingSchedules = db.prepare(sql).all(...params);

  for (const s of existingSchedules) {
    const existingStart = dayjs(`${schedule_date} ${s.start_time}`);
    const existingEnd = dayjs(`${schedule_date} ${s.end_time}`);
    const newStart = dayjs(`${schedule_date} ${start_time}`);
    const newEnd = dayjs(`${schedule_date} ${end_time}`);
    
    if (newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart)) {
      conflicts.push({ type: 'overlap', message: `与已有排班 ${s.start_time}-${s.end_time} 时间重叠` });
    }
  }

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employee_id);
  if (employee) {
    const newHours = dayjs(`${schedule_date} ${end_time}`).diff(dayjs(`${schedule_date} ${start_time}`), 'hour', true);
    let totalHours = newHours;
    for (const s of existingSchedules) {
      if (!exclude_id || s.id !== exclude_id) {
        totalHours += dayjs(`${schedule_date} ${s.end_time}`).diff(dayjs(`${schedule_date} ${s.start_time}`), 'hour', true);
      }
    }
    if (totalHours > employee.max_daily_hours) {
      conflicts.push({ type: 'daily_hours', message: `日工时 ${totalHours.toFixed(1)}h 超过最大限制 ${employee.max_daily_hours}h` });
    }
  }

  return conflicts;
}

router.get('/', (req, res) => {
  const { store_id, start_date, end_date, employee_id } = req.query;
  let sql = `
    SELECT s.*, e.name as employee_name, e.skills, e.position
    FROM schedules s
    JOIN employees e ON s.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (store_id) {
    sql += ' AND s.store_id = ?';
    params.push(store_id);
  }
  if (employee_id) {
    sql += ' AND s.employee_id = ?';
    params.push(employee_id);
  }
  if (start_date && end_date) {
    sql += ' AND s.schedule_date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }
  sql += ' ORDER BY s.schedule_date, s.start_time';
  const schedules = db.prepare(sql).all(...params);
  res.json({ success: true, data: schedules });
});

router.post('/check-conflict', (req, res) => {
  const { employee_id, schedule_date, start_time, end_time } = req.body;
  const conflicts = checkScheduleConflict(employee_id, schedule_date, start_time, end_time);
  res.json({ success: true, data: { hasConflict: conflicts.length > 0, conflicts } });
});

router.post('/', (req, res) => {
  const { store_id, employee_id, schedule_date, start_time, end_time, shift_type, check_conflict = true } = req.body;
  
  if (check_conflict) {
    const conflicts = checkScheduleConflict(employee_id, schedule_date, start_time, end_time);
    if (conflicts.length > 0) {
      return res.json({ success: false, message: '排班冲突', data: { conflicts } });
    }
  }

  const stmt = db.prepare(`
    INSERT INTO schedules (store_id, employee_id, schedule_date, start_time, end_time, shift_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(store_id, employee_id, schedule_date, start_time, end_time, shift_type);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { store_id, employee_id, schedule_date, start_time, end_time, shift_type, check_conflict = true } = req.body;
  
  if (check_conflict) {
    const conflicts = checkScheduleConflict(employee_id, schedule_date, start_time, end_time, id);
    if (conflicts.length > 0) {
      return res.json({ success: false, message: '排班冲突', data: { conflicts } });
    }
  }

  db.prepare(`
    UPDATE schedules 
    SET store_id = ?, employee_id = ?, schedule_date = ?, start_time = ?, end_time = ?, shift_type = ?
    WHERE id = ?
  `).run(store_id, employee_id, schedule_date, start_time, end_time, shift_type, id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;
