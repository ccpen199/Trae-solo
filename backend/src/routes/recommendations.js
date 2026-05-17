const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const recommendations = db.prepare(`
      SELECT 
        r.id,
        r.user_id,
        r.song_id,
        r.reason_text,
        r.gif_url,
        r.play_count,
        r.like_count,
        r.heart_count,
        r.comment_count,
        r.approved_at,
        u.nickname as user_nickname,
        u.avatar as user_avatar,
        s.title as song_title,
        s.artist as song_artist,
        s.cover as song_cover,
        s.duration as song_duration,
        s.lyrics as song_lyrics
      FROM recommendations r
      JOIN users u ON r.user_id = u.id
      JOIN songs s ON r.song_id = s.id
      WHERE r.status = 'approved'
      ORDER BY r.approved_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = db.prepare("SELECT COUNT(*) as count FROM recommendations WHERE status = 'approved'").get();

    res.json({ 
      success: true, 
      data: { 
        list: recommendations, 
        total: total.count,
        page: parseInt(page),
        limit: parseInt(limit)
      } 
    });
  } catch (error) {
    console.error('获取推荐列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const recommendation = db.prepare(`
      SELECT 
        r.id,
        r.user_id,
        r.song_id,
        r.reason_text,
        r.gif_url,
        r.play_count,
        r.like_count,
        r.heart_count,
        r.comment_count,
        r.approved_at,
        u.nickname as user_nickname,
        u.avatar as user_avatar,
        s.title as song_title,
        s.artist as song_artist,
        s.cover as song_cover,
        s.duration as song_duration,
        s.lyrics as song_lyrics
      FROM recommendations r
      JOIN users u ON r.user_id = u.id
      JOIN songs s ON r.song_id = s.id
      WHERE r.id = ? AND r.status = 'approved'
    `).get(id);

    if (!recommendation) {
      return res.status(404).json({ success: false, message: '推荐不存在' });
    }

    db.prepare('UPDATE recommendations SET play_count = play_count + 1 WHERE id = ?').run(id);

    res.json({ success: true, data: recommendation });
  } catch (error) {
    console.error('获取推荐详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', authenticateToken, [
  body('song_id').isInt().withMessage('请选择歌曲'),
  body('reason_text').optional().isLength({ max: 500 }).withMessage('推荐理由最多500字'),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { song_id, reason_text } = req.body;

    const song = db.prepare('SELECT id FROM songs WHERE id = ?').get(song_id);
    if (!song) {
      return res.status(400).json({ success: false, message: '歌曲不存在' });
    }

    const result = db.prepare(`
      INSERT INTO recommendations (user_id, song_id, reason_text, status)
      VALUES (?, ?, ?, 'pending')
    `).run(req.user.id, song_id, reason_text || '');

    res.json({ 
      success: true, 
      message: '推荐提交成功，等待审核',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('提交推荐错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/like', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const recommendation = db.prepare('SELECT id FROM recommendations WHERE id = ?').get(id);
    if (!recommendation) {
      return res.status(404).json({ success: false, message: '推荐不存在' });
    }

    const existingLike = db.prepare('SELECT id FROM user_likes WHERE user_id = ? AND recommendation_id = ?').get(req.user.id, id);

    if (existingLike) {
      db.prepare('DELETE FROM user_likes WHERE id = ?').run(existingLike.id);
      db.prepare('UPDATE recommendations SET like_count = like_count - 1 WHERE id = ?').run(id);
      res.json({ success: true, data: { liked: false, like_count: recommendation.like_count - 1 } });
    } else {
      db.prepare('INSERT INTO user_likes (user_id, recommendation_id) VALUES (?, ?)').run(req.user.id, id);
      db.prepare('UPDATE recommendations SET like_count = like_count + 1 WHERE id = ?').run(id);
      res.json({ success: true, data: { liked: true, like_count: recommendation.like_count + 1 } });
    }
  } catch (error) {
    console.error('点赞错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/heart', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const recommendation = db.prepare('SELECT id FROM recommendations WHERE id = ?').get(id);
    if (!recommendation) {
      return res.status(404).json({ success: false, message: '推荐不存在' });
    }

    const existingHeart = db.prepare('SELECT id FROM user_hearts WHERE user_id = ? AND recommendation_id = ?').get(req.user.id, id);

    if (existingHeart) {
      db.prepare('DELETE FROM user_hearts WHERE id = ?').run(existingHeart.id);
      db.prepare('UPDATE recommendations SET heart_count = heart_count - 1 WHERE id = ?').run(id);
      res.json({ success: true, data: { hearted: false, heart_count: recommendation.heart_count - 1 } });
    } else {
      db.prepare('INSERT INTO user_hearts (user_id, recommendation_id) VALUES (?, ?)').run(req.user.id, id);
      db.prepare('UPDATE recommendations SET heart_count = heart_count + 1 WHERE id = ?').run(id);
      res.json({ success: true, data: { hearted: true, heart_count: recommendation.heart_count + 1 } });
    }
  } catch (error) {
    console.error('红心错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/user/my', authenticateToken, (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        r.id,
        r.song_id,
        r.reason_text,
        r.status,
        r.play_count,
        r.like_count,
        r.heart_count,
        r.comment_count,
        r.submitted_at,
        s.title as song_title,
        s.artist as song_artist,
        s.cover as song_cover
      FROM recommendations r
      JOIN songs s ON r.song_id = s.id
      WHERE r.user_id = ?
    `;

    const params = [req.user.id];

    if (status) {
      query += " AND r.status = ?";
      params.push(status);
    }

    query += " ORDER BY r.submitted_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const recommendations = db.prepare(query).all(...params);

    let countQuery = "SELECT COUNT(*) as count FROM recommendations WHERE user_id = ?";
    const countParams = [req.user.id];
    if (status) {
      countQuery += " AND status = ?";
      countParams.push(status);
    }

    const total = db.prepare(countQuery).get(...countParams);

    res.json({ 
      success: true, 
      data: { 
        list: recommendations, 
        total: total.count,
        page: parseInt(page),
        limit: parseInt(limit)
      } 
    });
  } catch (error) {
    console.error('获取我的推荐错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
