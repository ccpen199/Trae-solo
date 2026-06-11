const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { success, error, paginate } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function generateRoomId() {
  return 'ROOM' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateRoomPassword() {
  return Math.random().toString().substring(2, 8);
}

router.get('/', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, status, job_id, date_from, date_to } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE i.hr_id IN (SELECT id FROM hr_users WHERE company_id = ?)';
  const params = [req.companyId];
  
  if (status && status !== 'all') {
    where += ' AND i.status = ?';
    params.push(status);
  }
  if (job_id) {
    where += ' AND i.job_id = ?';
    params.push(job_id);
  }
  if (date_from) {
    where += ' AND i.schedule_time >= ?';
    params.push(date_from);
  }
  if (date_to) {
    where += ' AND i.schedule_time <= ?';
    params.push(date_to + ' 23:59:59');
  }
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM interviews i ${where}
  `).get(...params).count;
  
  const list = db.prepare(`
    SELECT i.*, j.title, c.name as candidate_name, c.phone, c.email, c.avatar,
      hu.name as hr_name, hu.avatar as hr_avatar
    FROM interviews i
    LEFT JOIN jobs j ON i.job_id = j.id
    LEFT JOIN candidates c ON i.candidate_id = c.id
    LEFT JOIN hr_users hu ON i.hr_id = hu.id
    ${where}
    ORDER BY i.schedule_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  res.json(paginate(list, total, parseInt(page), parseInt(pageSize)));
});

router.get('/:id', authMiddleware, (req, res) => {
  const interview = db.prepare(`
    SELECT i.*, j.title, j.salary_min, j.salary_max, j.work_city,
      c.*, hu.name as hr_name, hu.avatar as hr_avatar,
      ja.status as application_status, ja.match_score
    FROM interviews i
    LEFT JOIN jobs j ON i.job_id = j.id
    LEFT JOIN candidates c ON i.candidate_id = c.id
    LEFT JOIN hr_users hu ON i.hr_id = hu.id
    LEFT JOIN job_applications ja ON i.application_id = ja.id
    WHERE i.id = ? AND j.company_id = ?
  `).get(req.params.id, req.companyId);
  
  if (!interview) {
    return res.json(error('面试记录不存在'));
  }
  
  res.json(success(interview));
});

router.post('/', authMiddleware, (req, res) => {
  const { application_id, interview_type, interview_round, schedule_time, duration, interviewer_name, interviewer_phone } = req.body;
  
  if (!application_id || !schedule_time) {
    return res.json(error('请填写完整信息'));
  }
  
  const application = db.prepare(`
    SELECT ja.*, j.company_id
    FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    WHERE ja.id = ? AND j.company_id = ?
  `).get(application_id, req.companyId);
  
  if (!application) {
    return res.json(error('投递记录不存在'));
  }
  
  const roomId = generateRoomId();
  const roomPassword = generateRoomPassword();
  
  const info = db.prepare(`
    INSERT INTO interviews (application_id, job_id, candidate_id, hr_id, interview_type, interview_round, schedule_time, duration, room_id, room_password, status, interviewer_name, interviewer_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
  `).run(application_id, application.job_id, application.candidate_id, req.userId, interview_type || 'video', interview_round || 1, schedule_time, duration || 30, roomId, roomPassword, interviewer_name, interviewer_phone);
  
  db.prepare(`
    UPDATE job_applications SET status = 'interview', updated_at = datetime('now')
    WHERE id = ?
  `).run(application_id);
  
  res.json(success({
    id: info.lastInsertRowid,
    room_id: roomId,
    room_password: roomPassword
  }, '面试安排成功'));
});

router.put('/:id', authMiddleware, (req, res) => {
  const { interview_type, interview_round, schedule_time, duration, interviewer_name, interviewer_phone } = req.body;
  
  const interview = db.prepare(`
    SELECT i.* FROM interviews i
    LEFT JOIN jobs j ON i.job_id = j.id
    WHERE i.id = ? AND j.company_id = ?
  `).get(req.params.id, req.companyId);
  
  if (!interview) {
    return res.json(error('面试记录不存在'));
  }
  
  db.prepare(`
    UPDATE interviews SET
      interview_type = ?, interview_round = ?, schedule_time = ?,
      duration = ?, interviewer_name = ?, interviewer_phone = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(interview_type || interview.interview_type, interview_round || interview.interview_round, schedule_time || interview.schedule_time, duration || interview.duration, interviewer_name, interviewer_phone, req.params.id);
  
  res.json(success(null, '更新成功'));
});

router.post('/:id/start', authMiddleware, (req, res) => {
  const interview = db.prepare(`
    SELECT i.* FROM interviews i
    LEFT JOIN jobs j ON i.job_id = j.id
    WHERE i.id = ? AND j.company_id = ?
  `).get(req.params.id, req.companyId);
  
  if (!interview) {
    return res.json(error('面试记录不存在'));
  }
  
  db.prepare(`
    UPDATE interviews SET status = 'in_progress', start_time = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(req.params.id);
  
  res.json(success({
    room_id: interview.room_id,
    room_password: interview.room_password,
    join_url: `/interview/${interview.room_id}?pwd=${interview.room_password}`
  }, '面试已开始'));
});

router.post('/:id/end', authMiddleware, (req, res) => {
  const { evaluation_score, evaluation_content, result, interview_content, record_file } = req.body;
  
  const interview = db.prepare(`
    SELECT i.* FROM interviews i
    LEFT JOIN jobs j ON i.job_id = j.id
    WHERE i.id = ? AND j.company_id = ?
  `).get(req.params.id, req.companyId);
  
  if (!interview) {
    return res.json(error('面试记录不存在'));
  }
  
  db.prepare(`
    UPDATE interviews SET
      status = 'completed', end_time = datetime('now'),
      evaluation_score = ?, evaluation_content = ?, result = ?,
      interview_content = ?, record_file = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(evaluation_score, evaluation_content, result, interview_content, record_file, req.params.id);
  
  if (result === 'pass') {
    const nextRound = (interview.interview_round || 1) + 1;
    if (nextRound <= 3) {
      db.prepare(`
        UPDATE job_applications SET status = 'interview', updated_at = datetime('now')
        WHERE id = ?
      `).run(interview.application_id);
    } else {
      db.prepare(`
        UPDATE job_applications SET status = 'offer', updated_at = datetime('now')
        WHERE id = ?
      `).run(interview.application_id);
    }
  } else if (result === 'fail') {
    db.prepare(`
      UPDATE job_applications SET status = 'rejected', updated_at = datetime('now')
      WHERE id = ?
    `).run(interview.application_id);
  }
  
  res.json(success(null, '面试已结束'));
});

router.post('/:id/cancel', authMiddleware, (req, res) => {
  const { reason } = req.body;
  
  db.prepare(`
    UPDATE interviews SET status = 'cancelled', updated_at = datetime('now')
    WHERE id IN (SELECT i.id FROM interviews i LEFT JOIN jobs j ON i.job_id = j.id WHERE i.id = ? AND j.company_id = ?)
  `).run(req.params.id, req.companyId);
  
  res.json(success(null, '面试已取消'));
});

router.get('/room/:roomId', authMiddleware, (req, res) => {
  const { roomId } = req.params;
  
  const interview = db.prepare(`
    SELECT i.*, j.title, c.name as candidate_name, c.phone, c.avatar,
      hu.name as hr_name, hu.avatar as hr_avatar
    FROM interviews i
    LEFT JOIN jobs j ON i.job_id = j.id
    LEFT JOIN candidates c ON i.candidate_id = c.id
    LEFT JOIN hr_users hu ON i.hr_id = hu.id
    WHERE i.room_id = ? AND j.company_id = ?
  `).get(roomId, req.companyId);
  
  if (!interview) {
    return res.json(error('会议室不存在'));
  }
  
  res.json(success({
    interview,
    ice_servers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ],
    token: crypto.createHash('md5').update(roomId + Date.now()).digest('hex')
  }));
});

router.get('/upcoming/today', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const interviews = db.prepare(`
    SELECT i.*, j.title, c.name as candidate_name, c.phone, c.avatar
    FROM interviews i
    LEFT JOIN jobs j ON i.job_id = j.id
    LEFT JOIN candidates c ON i.candidate_id = c.id
    WHERE j.company_id = ? 
      AND i.status = 'scheduled'
      AND DATE(i.schedule_time) = ?
    ORDER BY i.schedule_time ASC
    LIMIT 10
  `).all(req.companyId, today);
  
  res.json(success({
    count: interviews.length,
    interviews
  }));
});

module.exports = router;
