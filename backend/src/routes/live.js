const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/apply-streamer', authenticateToken, [
  body('streamer_type').isIn(['private_coach', 'planner', 'nutritionist', 'influencer']),
  body('real_name').notEmpty(),
  body('id_card').notEmpty()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    const { streamer_type, real_name, id_card, certifications, experience } = req.body;
    
    const existing = db.prepare('SELECT id FROM streamer_applications WHERE user_id = ? AND status = ?').get(req.user.id, 'pending');
    if (existing) {
      return res.status(400).json({ success: false, message: '已有申请待审核' });
    }

    db.prepare(`
      INSERT INTO streamer_applications (user_id, streamer_type, real_name, id_card, certifications, experience)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, streamer_type, real_name, id_card, certifications || '', experience || '');

    res.json({ success: true, message: '申请已提交，请等待审核' });
  } catch (error) {
    console.error('申请主播错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/streams', (req, res) => {
  try {
    const { status = 'live' } = req.query;
    let streams;
    
    if (status === 'live') {
      streams = db.prepare(`
        SELECT ls.*, u.nickname as streamer_name, u.avatar as streamer_avatar
        FROM live_streams ls
        JOIN users u ON ls.streamer_id = u.id
        WHERE ls.status = 'live'
        ORDER BY ls.start_time DESC
      `).all();
    } else if (status === 'scheduled') {
      streams = db.prepare(`
        SELECT ls.*, u.nickname as streamer_name, u.avatar as streamer_avatar
        FROM live_streams ls
        JOIN users u ON ls.streamer_id = u.id
        WHERE ls.status = 'scheduled'
        ORDER BY ls.scheduled_time ASC
      `).all();
    } else {
      streams = db.prepare(`
        SELECT ls.*, u.nickname as streamer_name, u.avatar as streamer_avatar
        FROM live_streams ls
        JOIN users u ON ls.streamer_id = u.id
        ORDER BY ls.created_at DESC
      `).all();
    }

    res.json({ success: true, data: streams });
  } catch (error) {
    console.error('获取直播列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/schedule', authenticateToken, [
  body('title').notEmpty(),
  body('scheduled_time').notEmpty()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    const { title, description, cover_image, scheduled_time, category } = req.body;

    const result = db.prepare(`
      INSERT INTO live_streams (streamer_id, title, description, cover_image, scheduled_time, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, title, description || '', cover_image || '', scheduled_time, category || '健身');

    res.json({ success: true, data: { id: result.lastInsertRowid }, message: '直播已预约' });
  } catch (error) {
    console.error('预约直播错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/start', authenticateToken, (req, res) => {
  try {
    const stream = db.prepare('SELECT * FROM live_streams WHERE id = ?').get(req.params.id);
    if (!stream) {
      return res.status(404).json({ success: false, message: '直播不存在' });
    }
    if (stream.streamer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限操作' });
    }

    db.prepare('UPDATE live_streams SET status = ?, start_time = CURRENT_TIMESTAMP WHERE id = ?').run('live', req.params.id);
    res.json({ success: true, message: '直播已开始' });
  } catch (error) {
    console.error('开始直播错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/end', authenticateToken, (req, res) => {
  try {
    const stream = db.prepare('SELECT * FROM live_streams WHERE id = ?').get(req.params.id);
    if (!stream) {
      return res.status(404).json({ success: false, message: '直播不存在' });
    }
    if (stream.streamer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权限操作' });
    }

    db.prepare('UPDATE live_streams SET status = ?, end_time = CURRENT_TIMESTAMP WHERE id = ?').run('ended', req.params.id);
    res.json({ success: true, message: '直播已结束' });
  } catch (error) {
    console.error('结束直播错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/reserve', authenticateToken, (req, res) => {
  try {
    const stream = db.prepare('SELECT * FROM live_streams WHERE id = ?').get(req.params.id);
    if (!stream) {
      return res.status(404).json({ success: false, message: '直播不存在' });
    }

    try {
      db.prepare('INSERT INTO stream_reservations (user_id, stream_id) VALUES (?, ?)').run(req.user.id, req.params.id);
      res.json({ success: true, message: '预约成功' });
    } catch (e) {
      res.json({ success: true, message: '已预约过该直播' });
    }
  } catch (error) {
    console.error('预约直播错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id/messages', authenticateToken, (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT sm.*, u.nickname, u.avatar
      FROM stream_messages sm
      JOIN users u ON sm.user_id = u.id
      WHERE sm.stream_id = ?
      ORDER BY sm.created_at DESC
      LIMIT 50
    `).all(req.params.id);

    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    console.error('获取弹幕错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/messages', authenticateToken, [
  body('content').notEmpty()
], (req, res) => {
  try {
    db.prepare('INSERT INTO stream_messages (stream_id, user_id, content) VALUES (?, ?, ?)').run(req.params.id, req.user.id, req.body.content);
    res.json({ success: true, message: '发送成功' });
  } catch (error) {
    console.error('发送弹幕错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/replays', (req, res) => {
  try {
    const replays = db.prepare(`
      SELECT sr.*, ls.title, ls.streamer_id, u.nickname as streamer_name
      FROM stream_replays sr
      JOIN live_streams ls ON sr.stream_id = ls.id
      JOIN users u ON ls.streamer_id = u.id
      ORDER BY sr.created_at DESC
      LIMIT 20
    `).all();

    res.json({ success: true, data: replays });
  } catch (error) {
    console.error('获取回放列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
