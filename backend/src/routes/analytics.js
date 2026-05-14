const express = require('express');
const { db } = require('../database/init');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const { event_type, start_date, end_date, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM analytics WHERE user_id = ?';
    let params = [req.user.id];

    if (event_type) {
      query += ' AND event_type = ?';
      params.push(event_type);
    }

    if (start_date) {
      query += ' AND created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND created_at <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const records = db.prepare(query).all(...params);

    const stats = {
      view_profile: 0,
      view_post: 0,
      like_post: 0,
      comment_post: 0,
      favorite_post: 0,
      create_post: 0,
      view_chat: 0,
      send_message: 0,
      match: 0
    };

    records.forEach(record => {
      if (stats[record.event_type] !== undefined) {
        stats[record.event_type]++;
      }
    });

    res.json({ success: true, data: { records, stats, total: records.length } });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/event', authMiddleware, (req, res) => {
  try {
    const { event_type, event_data, page } = req.body;

    if (!event_type) {
      return res.status(400).json({ success: false, message: '请提供事件类型' });
    }

    db.prepare('INSERT INTO analytics (user_id, event_type, event_data, page) VALUES (?, ?, ?, ?)').run(
      req.user.id,
      event_type,
      event_data ? JSON.stringify(event_data) : null,
      page || null
    );

    res.json({ success: true, message: '事件已记录' });
  } catch (error) {
    console.error('Record event error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
