const express = require('express');
const router = express.Router();
const db = require('../database/init');

const checkConflicts = (court_id, judge_id, start_time, end_time, exclude_schedule_id = null) => {
  const conflicts = [];
  
  const isHoliday = db.prepare(`
    SELECT COUNT(*) as count FROM holidays 
    WHERE date = DATE(?)
  `).get(start_time).count > 0;
  
  if (isHoliday) {
    conflicts.push({ type: 'holiday', message: '排期日期为节假日' });
  }

  const startDate = new Date(start_time);
  if (startDate.getDay() === 0 || startDate.getDay() === 6) {
    conflicts.push({ type: 'weekend', message: '排期日期为周末' });
  }

  let courtConflictQuery = `
    SELECT COUNT(*) as count FROM schedules 
    WHERE court_id = ? 
    AND status NOT IN ('cancelled', 'completed')
    AND (
      (start_time <= ? AND end_time > ?) OR
      (start_time < ? AND end_time >= ?) OR
      (start_time >= ? AND end_time <= ?)
    )
  `;
  const courtParams = [court_id, end_time, start_time, end_time, start_time, start_time, end_time];
  
  if (exclude_schedule_id) {
    courtConflictQuery += ' AND id != ?';
    courtParams.push(exclude_schedule_id);
  }
  
  const hasCourtConflict = db.prepare(courtConflictQuery).get(...courtParams).count > 0;
  
  if (hasCourtConflict) {
    conflicts.push({ type: 'court', message: '法庭时间冲突' });
  }

  let judgeConflictQuery = `
    SELECT COUNT(*) as count FROM schedules 
    WHERE judge_id = ? 
    AND status NOT IN ('cancelled', 'completed')
    AND (
      (start_time <= ? AND end_time > ?) OR
      (start_time < ? AND end_time >= ?) OR
      (start_time >= ? AND end_time <= ?)
    )
  `;
  const judgeParams = [judge_id, end_time, start_time, end_time, start_time, start_time, end_time];
  
  if (exclude_schedule_id) {
    judgeConflictQuery += ' AND id != ?';
    judgeParams.push(exclude_schedule_id);
  }
  
  const hasJudgeConflict = db.prepare(judgeConflictQuery).get(...judgeParams).count > 0;
  
  if (hasJudgeConflict) {
    conflicts.push({ type: 'judge', message: '法官时间冲突' });
  }

  const isJudgeOnLeave = db.prepare(`
    SELECT COUNT(*) as count FROM judge_leaves 
    WHERE judge_id = ? 
    AND DATE(?) BETWEEN DATE(start_date) AND DATE(end_date)
  `).get(judge_id, start_time).count > 0;
  
  if (isJudgeOnLeave) {
    conflicts.push({ type: 'judge_leave', message: '法官当日请假' });
  }

  return conflicts;
};

router.get('/', (req, res) => {
  const { start_date, end_date, court_id, judge_id, status } = req.query;
  let query = `
    SELECT s.*, c.case_number, c.case_reason, ct.name as court_name, 
           j.name as judge_name, cl.name as clerk_name
    FROM schedules s
    JOIN cases c ON s.case_id = c.id
    JOIN courts ct ON s.court_id = ct.id
    JOIN judges j ON s.judge_id = j.id
    LEFT JOIN clerks cl ON s.clerk_id = cl.id
    WHERE 1=1
  `;
  const params = [];

  if (start_date && end_date) {
    query += ' AND DATE(s.start_time) BETWEEN DATE(?) AND DATE(?)';
    params.push(start_date, end_date);
  }
  if (court_id) {
    query += ' AND s.court_id = ?';
    params.push(court_id);
  }
  if (judge_id) {
    query += ' AND s.judge_id = ?';
    params.push(judge_id);
  }
  if (status) {
    query += ' AND s.status = ?';
    params.push(status);
  }
  query += ' ORDER BY s.start_time';

  const schedules = db.prepare(query).all(...params);
  res.json(schedules);
});

router.get('/calendar', (req, res) => {
  const { start_date, end_date } = req.query;
  const schedules = db.prepare(`
    SELECT s.*, c.case_number, c.case_reason, ct.name as court_name, 
           j.name as judge_name
    FROM schedules s
    JOIN cases c ON s.case_id = c.id
    JOIN courts ct ON s.court_id = ct.id
    JOIN judges j ON s.judge_id = j.id
    WHERE s.status NOT IN ('cancelled')
    AND DATE(s.start_time) BETWEEN DATE(?) AND DATE(?)
    ORDER BY s.start_time
  `).all(start_date, end_date);

  res.json(schedules);
});

router.get('/:id', (req, res) => {
  const schedule = db.prepare(`
    SELECT s.*, c.case_number, c.case_reason, c.parties, ct.name as court_name, 
           j.name as judge_name, cl.name as clerk_name
    FROM schedules s
    JOIN cases c ON s.case_id = c.id
    JOIN courts ct ON s.court_id = ct.id
    JOIN judges j ON s.judge_id = j.id
    LEFT JOIN clerks cl ON s.clerk_id = cl.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!schedule) {
    return res.status(404).json({ error: 'Schedule not found' });
  }

  const notifications = db.prepare('SELECT * FROM notifications WHERE schedule_id = ?').all(req.params.id);
  const changes = db.prepare(`
    SELECT sc.*, os.start_time as original_start_time, ns.start_time as new_start_time
    FROM schedule_changes sc
    LEFT JOIN schedules os ON sc.original_schedule_id = os.id
    LEFT JOIN schedules ns ON sc.new_schedule_id = ns.id
    WHERE sc.original_schedule_id = ? OR sc.new_schedule_id = ?
  `).all(req.params.id, req.params.id);

  res.json({ ...schedule, notifications, changes });
});

router.post('/check-conflicts', (req, res) => {
  const { court_id, judge_id, start_time, end_time, exclude_schedule_id } = req.body;
  const conflicts = checkConflicts(court_id, judge_id, start_time, end_time, exclude_schedule_id);
  res.json({ has_conflicts: conflicts.length > 0, conflicts });
});

router.post('/', (req, res) => {
  const { case_id, court_id, judge_id, clerk_id, start_time, end_time, hearing_type, notes } = req.body;

  const caseData = db.prepare('SELECT materials_complete, status FROM cases WHERE id = ?').get(case_id);
  if (!caseData) {
    return res.status(404).json({ error: 'Case not found' });
  }
  if (caseData.materials_complete !== 1) {
    return res.status(400).json({ error: '案件材料不完整，无法排期' });
  }

  const conflicts = checkConflicts(court_id, judge_id, start_time, end_time);
  if (conflicts.length > 0) {
    return res.status(400).json({ error: '存在排期冲突', conflicts });
  }

  const result = db.prepare(`
    INSERT INTO schedules (case_id, court_id, judge_id, clerk_id, start_time, end_time, hearing_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(case_id, court_id, judge_id, clerk_id || null, start_time, end_time, hearing_type || 'in_person', notes || null);

  const scheduleId = result.lastInsertRowid;

  db.prepare('UPDATE cases SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run('scheduled', case_id);

  db.prepare(`
    INSERT INTO case_timeline (case_id, event_type, event_content, operator)
    VALUES (?, 'schedule', '排期完成，开庭时间: ' || ?, 'system')
  `).run(case_id, start_time);

  res.status(201).json({ id: scheduleId, ...req.body });
});

router.post('/:id/postpone', (req, res) => {
  const { id } = req.params;
  const { application_reason, applicant, new_schedule_data } = req.body;

  const originalSchedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
  if (!originalSchedule) {
    return res.status(404).json({ error: 'Schedule not found' });
  }

  db.prepare('UPDATE schedules SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run('postponed', id);

  let newScheduleId = null;
  if (new_schedule_data) {
    const conflicts = checkConflicts(
      new_schedule_data.court_id,
      new_schedule_data.judge_id,
      new_schedule_data.start_time,
      new_schedule_data.end_time,
      id
    );
    
    if (conflicts.length > 0) {
      return res.status(400).json({ error: '新排期存在冲突', conflicts });
    }

    const newResult = db.prepare(`
      INSERT INTO schedules (case_id, court_id, judge_id, clerk_id, start_time, end_time, hearing_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      originalSchedule.case_id,
      new_schedule_data.court_id,
      new_schedule_data.judge_id,
      new_schedule_data.clerk_id || originalSchedule.clerk_id,
      new_schedule_data.start_time,
      new_schedule_data.end_time,
      new_schedule_data.hearing_type || originalSchedule.hearing_type,
      new_schedule_data.notes || null
    );
    newScheduleId = newResult.lastInsertRowid;
  }

  db.prepare(`
    INSERT INTO schedule_changes (original_schedule_id, new_schedule_id, application_reason, applicant, approver, approval_status)
    VALUES (?, ?, ?, ?, 'system', 'approved')
  `).run(id, newScheduleId, application_reason, applicant);

  db.prepare(`
    INSERT INTO case_timeline (case_id, event_type, event_content, operator)
    VALUES (?, 'postpone', ?, ?)
  `).run(originalSchedule.case_id, '改期原因: ' + application_reason, applicant);

  if (newScheduleId) {
    db.prepare(`
      INSERT INTO case_timeline (case_id, event_type, event_content, operator)
      VALUES (?, 'schedule', '新排期: ' || ?, 'system')
    `).run(originalSchedule.case_id, new_schedule_data.start_time);
  }

  res.json({ 
    message: '改期申请已提交', 
    change_id: id,
    new_schedule_id: newScheduleId 
  });
});

router.post('/batch-postpone', (req, res) => {
  const { schedule_ids, application_reason, applicant, new_date } = req.body;
  const results = [];

  for (const scheduleId of schedule_ids) {
    const originalSchedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId);
    if (!originalSchedule) continue;

    db.prepare('UPDATE schedules SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('postponed', scheduleId);

    db.prepare(`
      INSERT INTO schedule_changes (original_schedule_id, application_reason, applicant, approver, approval_status)
      VALUES (?, ?, ?, 'system', 'approved')
    `).run(scheduleId, application_reason, applicant);

    db.prepare(`
      INSERT INTO case_timeline (case_id, event_type, event_content, operator)
      VALUES (?, 'postpone', ?, ?)
    `).run(originalSchedule.case_id, '批量改期: ' + application_reason, applicant);

    results.push({ schedule_id: scheduleId, status: 'postponed' });
  }

  res.json({ message: '批量改期完成', results });
});

module.exports = router;
