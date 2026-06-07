const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('./auth');

const router = express.Router();

router.post('/check-in', authMiddleware, (req, res) => {
  const { job_match_id } = req.body;

  if (!job_match_id) {
    return res.status(400).json({ error: '匹配ID不能为空' });
  }

  try {
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.userId);
    if (!worker) {
      return res.status(400).json({ error: '工友信息不存在' });
    }

    const match = db.prepare('SELECT * FROM job_matches WHERE id = ? AND (worker_id = ? OR team_id IS NOT NULL)').get(job_match_id, worker.id);
    if (!match) {
      return res.status(403).json({ error: '无权限操作' });
    }

    const today = new Date().toISOString().split('T')[0];
    const existing = db.prepare(`
      SELECT id FROM attendances 
      WHERE job_match_id = ? AND worker_id = ? AND DATE(created_at) = ?
    `).get(job_match_id, worker.id, today);

    if (existing) {
      return res.status(400).json({ error: '今日已打卡' });
    }

    const result = db.prepare(`
      INSERT INTO attendances (job_match_id, worker_id, check_in_time, location_verified)
      VALUES (?, ?, CURRENT_TIMESTAMP, 1)
    `).run(job_match_id, worker.id);

    res.json({ id: result.lastInsertRowid, message: '打卡成功' });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: '打卡失败' });
  }
});

router.post('/check-out', authMiddleware, (req, res) => {
  const { attendance_id } = req.body;

  try {
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.userId);
    if (!worker) {
      return res.status(400).json({ error: '工友信息不存在' });
    }

    const attendance = db.prepare(`
      SELECT * FROM attendances 
      WHERE id = ? AND worker_id = ? AND check_out_time IS NULL
    `).get(attendance_id, worker.id);

    if (!attendance) {
      return res.status(400).json({ error: '打卡记录不存在或已签退' });
    }

    const checkIn = new Date(attendance.check_in_time);
    const checkOut = new Date();
    const hoursWorked = ((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2);

    db.prepare(`
      UPDATE attendances 
      SET check_out_time = CURRENT_TIMESTAMP, hours_worked = ?
      WHERE id = ?
    `).run(hoursWorked, attendance_id);

    res.json({ message: '签退成功', hours_worked: hoursWorked });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: '签退失败' });
  }
});

router.get('/my', authMiddleware, (req, res) => {
  try {
    const worker = db.prepare('SELECT id FROM workers WHERE user_id = ?').get(req.userId);
    if (!worker) {
      return res.json([]);
    }

    const records = db.prepare(`
      SELECT a.*, jp.title as job_title, c.company_name
      FROM attendances a
      JOIN job_matches jm ON a.job_match_id = jm.id
      JOIN job_posts jp ON jm.job_id = jp.id
      JOIN companies c ON jp.company_id = c.id
      WHERE a.worker_id = ?
      ORDER BY a.created_at DESC
      LIMIT 30
    `).all(worker.id);

    res.json(records);
  } catch (error) {
    console.error('Get attendances error:', error);
    res.status(500).json({ error: '获取打卡记录失败' });
  }
});

router.post('/:id/confirm', authMiddleware, (req, res) => {
  if (req.userRole !== 'company') {
    return res.status(403).json({ error: '只有企业可以确认工时' });
  }

  try {
    db.prepare(`
      UPDATE attendances 
      SET confirmed = 1, confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.userId, req.params.id);

    res.json({ message: '工时已确认' });
  } catch (error) {
    console.error('Confirm attendance error:', error);
    res.status(500).json({ error: '确认失败' });
  }
});

module.exports = router;
