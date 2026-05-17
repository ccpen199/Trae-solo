const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { authenticateToken, optionalAuth, requirePermission, requireVip } = require('../middleware/auth');

const router = express.Router();

const generateBvid = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = 'BV';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

router.get('/list', optionalAuth, (req, res) => {
  const { page = 1, pageSize = 20, category, type = 'recommend' } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE v.status = 1';
  const params = [];

  if (category) {
    whereClause += ' AND v.category_id = ?';
    params.push(category);
  }

  let orderBy = 'v.created_at DESC';
  if (type === 'hot') {
    orderBy = '(v.view_count + v.like_count * 2) DESC';
  } else if (type === 'recommend') {
    orderBy = 'RANDOM()';
  }

  const videos = db.prepare(`
    SELECT v.*, u.nickname as author_name, u.avatar as author_avatar, c.name as category_name
    FROM videos v
    LEFT JOIN users u ON v.user_id = u.id
    LEFT JOIN categories c ON v.category_id = c.id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM videos v ${whereClause}`).get(...params);

  res.json({
    success: true,
    data: {
      list: videos,
      total: total.count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

router.get('/detail/:bvid', optionalAuth, (req, res) => {
  const { bvid } = req.params;

  const video = db.prepare(`
    SELECT v.*, u.nickname as author_name, u.avatar as author_avatar, u.level as author_level,
           up.follower_count, up.video_count
    FROM videos v
    LEFT JOIN users u ON v.user_id = u.id
    LEFT JOIN user_profiles up ON v.user_id = up.user_id
    WHERE v.bvid = ? AND v.status = 1
  `).get(bvid);

  if (!video) {
    return res.status(404).json({ success: false, message: '视频不存在' });
  }

  if (video.is_vip === 1 && (!req.user || req.user.vip_type === 0)) {
    return res.status(403).json({ success: false, message: '此视频需要大会员', needVip: true });
  }

  if (video.is_paid === 1) {
    if (!req.user) {
      return res.status(403).json({ success: false, message: '此视频需要购买', needPay: true, price: video.price });
    }
    const hasBought = db.prepare('SELECT id FROM orders WHERE user_id = ? AND product_id = ? AND status = 1').get(req.user.id, video.id);
    if (!hasBought) {
      return res.status(403).json({ success: false, message: '此视频需要购买', needPay: true, price: video.price });
    }
  }

  db.prepare('UPDATE videos SET view_count = view_count + 1 WHERE id = ?').run(video.id);

  let userInteraction = {};
  if (req.user) {
    const interactions = db.prepare('SELECT type FROM video_interactions WHERE video_id = ? AND user_id = ?').all(video.id, req.user.id);
    interactions.forEach(item => {
      userInteraction[item.type] = true;
    });
  }

  res.json({
    success: true,
    data: {
      video,
      userInteraction
    }
  });
});

router.post('/interact/:bvid', authenticateToken, (req, res) => {
  const { bvid } = req.params;
  const { type } = req.body;

  const validTypes = ['like', 'coin', 'collect', 'share'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ success: false, message: '无效的操作类型' });
  }

  const video = db.prepare('SELECT id, user_id FROM videos WHERE bvid = ?').get(bvid);
  if (!video) {
    return res.status(404).json({ success: false, message: '视频不存在' });
  }

  try {
    const existing = db.prepare('SELECT id FROM video_interactions WHERE video_id = ? AND user_id = ? AND type = ?').get(video.id, req.user.id, type);
    
    if (existing) {
      db.prepare('DELETE FROM video_interactions WHERE id = ?').run(existing.id);
      db.prepare(`UPDATE videos SET ${type}_count = ${type}_count - 1 WHERE id = ?`).run(video.id);
      res.json({ success: true, data: { action: 'cancel', type } });
    } else {
      db.prepare('INSERT INTO video_interactions (video_id, user_id, type) VALUES (?, ?, ?)').run(video.id, req.user.id, type);
      db.prepare(`UPDATE videos SET ${type}_count = ${type}_count + 1 WHERE id = ?`).run(video.id);
      
      const expGain = type === 'like' ? 5 : type === 'coin' ? 10 : type === 'collect' ? 3 : 2;
      db.prepare('UPDATE users SET exp = exp + ? WHERE id = ?').run(expGain, req.user.id);
      
      res.json({ success: true, data: { action: 'add', type, expGain } });
    }
  } catch (error) {
    console.error('互动错误:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

router.get('/comments/:bvid', optionalAuth, (req, res) => {
  const { bvid } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  const video = db.prepare('SELECT id FROM videos WHERE bvid = ?').get(bvid);
  if (!video) {
    return res.status(404).json({ success: false, message: '视频不存在' });
  }

  const comments = db.prepare(`
    SELECT c.*, u.nickname, u.avatar, u.level
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.video_id = ? AND c.parent_id = 0 AND c.status = 1
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(video.id, parseInt(pageSize), offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM comments WHERE video_id = ? AND parent_id = 0 AND status = 1').get(video.id);

  res.json({
    success: true,
    data: {
      list: comments,
      total: total.count
    }
  });
});

router.post('/comment/:bvid', authenticateToken, requirePermission('can_comment'), [
  body('content').isLength({ min: 1, max: 500 }).withMessage('评论内容在1-500字之间')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
  }

  const { bvid } = req.params;
  const { content, parent_id = 0 } = req.body;

  const video = db.prepare('SELECT id FROM videos WHERE bvid = ?').get(bvid);
  if (!video) {
    return res.status(404).json({ success: false, message: '视频不存在' });
  }

  try {
    db.prepare('INSERT INTO comments (video_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)').run(video.id, req.user.id, parent_id, content);
    db.prepare('UPDATE videos SET comment_count = comment_count + 1 WHERE id = ?').run(video.id);
    db.prepare('UPDATE users SET exp = exp + 5 WHERE id = ?').run(req.user.id);
    
    res.json({ success: true, message: '评论成功' });
  } catch (error) {
    console.error('评论错误:', error);
    res.status(500).json({ success: false, message: '评论失败' });
  }
});

router.get('/danmaku/:bvid', (req, res) => {
  const { bvid } = req.params;

  const video = db.prepare('SELECT id FROM videos WHERE bvid = ?').get(bvid);
  if (!video) {
    return res.status(404).json({ success: false, message: '视频不存在' });
  }

  const danmakus = db.prepare(`
    SELECT d.time, d.type, d.color, d.content
    FROM danmakus d
    WHERE d.video_id = ?
    ORDER BY d.time ASC
  `).all(video.id);

  res.json({
    success: true,
    data: danmakus
  });
});

router.post('/danmaku/:bvid', authenticateToken, requirePermission('can_danmaku'), [
  body('content').isLength({ min: 1, max: 50 }).withMessage('弹幕内容在1-50字之间'),
  body('time').isFloat({ min: 0 }).withMessage('时间无效')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
  }

  const { bvid } = req.params;
  const { content, time, color = '#FFFFFF', type = 1 } = req.body;

  const video = db.prepare('SELECT id FROM videos WHERE bvid = ?').get(bvid);
  if (!video) {
    return res.status(404).json({ success: false, message: '视频不存在' });
  }

  try {
    db.prepare('INSERT INTO danmakus (video_id, user_id, content, time, color, type) VALUES (?, ?, ?, ?, ?, ?)').run(video.id, req.user.id, content, time, color, type);
    db.prepare('UPDATE videos SET danmaku_count = danmaku_count + 1 WHERE id = ?').run(video.id);
    db.prepare('UPDATE users SET exp = exp + 2 WHERE id = ?').run(req.user.id);
    
    res.json({ success: true, message: '发送成功' });
  } catch (error) {
    console.error('弹幕错误:', error);
    res.status(500).json({ success: false, message: '发送失败' });
  }
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY sort_order ASC').all('video');
  res.json({ success: true, data: categories });
});

module.exports = router;
