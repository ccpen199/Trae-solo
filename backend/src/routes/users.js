const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { auth } = require('../middleware/auth');

router.get('/:id', (req, res) => {
  try {
    const user = db.prepare(`
      SELECT u.*, cl.name as level_name, cl.min_score, cl.max_score
      FROM users u
      LEFT JOIN creator_levels cl ON u.creator_level = cl.id
      WHERE u.id = ?
    `).get(req.params.id);
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' });
    }
    const { password_hash, ...safeUser } = user;

    let isFollowed = false;
    if (req.user) {
      const follow = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_type = \'user\' AND following_id = ?').get(req.user.id, req.params.id);
      isFollowed = !!follow;
    }

    const contentCount = db.prepare("SELECT COUNT(*) as cnt FROM contents WHERE user_id = ? AND status = 'active' AND review_status IN ('ai_approved', 'approved')").get(req.params.id).cnt;
    const totalLikes = db.prepare('SELECT COALESCE(SUM(like_count), 0) as total FROM contents WHERE user_id = ?').get(req.params.id).total;

    const tipEarnings = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM tips WHERE to_user_id = ?').get(req.params.id).total;
    const adEarnings = db.prepare('SELECT COALESCE(SUM(revenue), 0) as total FROM ad_revenues WHERE user_id = ?').get(req.params.id).total;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthlyTip = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM tips WHERE to_user_id = ? AND created_at >= ?').get(req.params.id, thisMonthStart).total;
    const monthlyAd = db.prepare('SELECT COALESCE(SUM(revenue), 0) as total FROM ad_revenues WHERE user_id = ? AND created_at >= ?').get(req.params.id, thisMonthStart).total;
    const monthlyEarnings = Math.round((monthlyTip + monthlyAd) * 100) / 100;

    const availableEarnings = Math.round((user.total_earnings || 0) * 0.8 * 100) / 100;

    res.json({
      code: 0,
      data: {
        ...safeUser,
        isFollowed,
        content_count: contentCount,
        total_likes: totalLikes,
        tip_earnings: tipEarnings,
        ad_earnings: adEarnings,
        monthly_earnings: monthlyEarnings,
        available_earnings: availableEarnings
      },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ code: 1, message: '无权修改' });
    }

    const { nickname, avatar, bio, city } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users SET
        nickname = COALESCE(?, nickname),
        avatar = COALESCE(?, avatar),
        bio = COALESCE(?, bio),
        city = COALESCE(?, city),
        updated_at = ?
      WHERE id = ?
    `).run(nickname || null, avatar || null, bio || null, city || null, now, req.params.id);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    const { password_hash, ...safeUser } = user;
    res.json({ code: 0, data: safeUser, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.post('/:id/follow', auth, (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user.id) {
      return res.status(400).json({ code: 1, message: '不能关注自己' });
    }

    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!target) {
      return res.status(404).json({ code: 1, message: '用户不存在' });
    }

    const existing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_type = \'user\' AND following_id = ?').get(req.user.id, targetId);

    if (existing) {
      db.prepare('DELETE FROM follows WHERE id = ?').run(existing.id);
      db.prepare('UPDATE users SET following_count = following_count - 1 WHERE id = ?').run(req.user.id);
      db.prepare('UPDATE users SET follower_count = follower_count - 1 WHERE id = ?').run(targetId);
      res.json({ code: 0, data: { followed: false }, message: '取消关注' });
    } else {
      const id = uuidv4();
      const now = new Date().toISOString();
      db.prepare('INSERT INTO follows (id, follower_id, following_type, following_id, created_at) VALUES (?, ?, \'user\', ?, ?)').run(id, req.user.id, targetId, now);
      db.prepare('UPDATE users SET following_count = following_count + 1 WHERE id = ?').run(req.user.id);
      db.prepare('UPDATE users SET follower_count = follower_count + 1 WHERE id = ?').run(targetId);
      res.json({ code: 0, data: { followed: true }, message: '关注成功' });
    }
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/:id/contents', (req, res) => {
  try {
    const { page = 1, pageSize = 20, content_type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let query = `
      SELECT c.*, u.nickname as author_nickname, u.avatar as author_avatar
      FROM contents c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ? AND c.status = 'active' AND c.review_status IN ('ai_approved', 'approved')
    `;
    const params = [req.params.id];

    if (content_type) {
      query += ' AND c.content_type = ?';
      params.push(content_type);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const contents = db.prepare(query).all(...params);
    res.json({ code: 0, data: { list: contents, page: parseInt(page), pageSize: parseInt(pageSize) }, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/:id/collections', (req, res) => {
  try {
    const targetId = req.params.id;
    const isOwner = req.user && req.user.id === targetId;

    let query = 'SELECT * FROM collections WHERE user_id = ?';
    const params = [targetId];

    if (!isOwner) {
      query += ' AND is_public = 1';
    }

    query += ' ORDER BY created_at DESC';

    const collections = db.prepare(query).all(...params);
    res.json({ code: 0, data: collections, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

module.exports = router;
