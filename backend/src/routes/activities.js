const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { status = 'upcoming' } = req.query;
    const activities = db.prepare(`
      SELECT * FROM offline_activities
      WHERE status = ?
      ORDER BY activity_time ASC
    `).all(status);

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('获取活动列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const activity = db.prepare('SELECT * FROM offline_activities WHERE id = ?').get(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }
    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('获取活动详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/register', authenticateToken, (req, res) => {
  try {
    const activity = db.prepare('SELECT * FROM offline_activities WHERE id = ?').get(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }
    if (activity.participant_count >= activity.max_participants) {
      return res.status(400).json({ success: false, message: '活动名额已满' });
    }

    try {
      db.prepare('INSERT INTO activity_registrations (user_id, activity_id) VALUES (?, ?)').run(req.user.id, req.params.id);
      db.prepare('UPDATE offline_activities SET participant_count = participant_count + 1 WHERE id = ?').run(req.params.id);
      res.json({ success: true, message: '报名成功' });
    } catch (e) {
      res.json({ success: true, message: '已报名过该活动' });
    }
  } catch (error) {
    console.error('活动报名错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', authenticateToken, [
  body('title').notEmpty(),
  body('gym_name').notEmpty(),
  body('address').notEmpty(),
  body('activity_time').notEmpty()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    const { title, description, gym_name, address, activity_time, max_participants, cover_image } = req.body;

    const result = db.prepare(`
      INSERT INTO offline_activities (title, description, gym_name, address, activity_time, max_participants, cover_image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, description || '', gym_name, address, activity_time, max_participants || 50, cover_image || '');

    res.json({ success: true, data: { id: result.lastInsertRowid }, message: '活动创建成功' });
  } catch (error) {
    console.error('创建活动错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
