const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { auth, requireRole } = require('../middleware/auth');

router.get('/dashboard', auth, requireRole('admin'), (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
    const totalContents = db.prepare('SELECT COUNT(*) as cnt FROM contents WHERE status = \'active\'').get().cnt;
    const totalComments = db.prepare('SELECT COUNT(*) as cnt FROM comments WHERE status = \'active\'').get().cnt;
    const pendingReviews = db.prepare('SELECT COUNT(*) as cnt FROM contents WHERE review_status = \'pending\' AND status = \'active\'').get().cnt;
    const totalTips = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM tips').get().total;
    const totalAdRevenue = db.prepare('SELECT COALESCE(SUM(revenue), 0) as total FROM ad_revenues').get().total;
    const todayUsers = db.prepare('SELECT COUNT(*) as cnt FROM users WHERE date(created_at) = date(\'now\')').get().cnt;
    const todayContents = db.prepare('SELECT COUNT(*) as cnt FROM contents WHERE date(created_at) = date(\'now\')').get().cnt;

    res.json({
      code: 0,
      data: {
        totalUsers, totalContents, totalComments, pendingReviews,
        totalTips, totalAdRevenue, todayUsers, todayContents
      },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/contents', auth, requireRole('admin'), (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, review_status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let query = `
      SELECT c.*, u.nickname as author_nickname, u.avatar as author_avatar
      FROM contents c
      JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    if (review_status) {
      query += ' AND c.review_status = ?';
      params.push(review_status);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const contents = db.prepare(query).all(...params);
    res.json({ code: 0, data: { list: contents, page: parseInt(page), pageSize: parseInt(pageSize) }, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.put('/contents/:id/feature', auth, requireRole('admin'), (req, res) => {
  try {
    const content = db.prepare('SELECT is_featured FROM contents WHERE id = ?').get(req.params.id);
    if (!content) {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }

    const newVal = content.is_featured ? 0 : 1;
    const now = new Date().toISOString();
    db.prepare('UPDATE contents SET is_featured = ?, updated_at = ? WHERE id = ?').run(newVal, now, req.params.id);

    res.json({ code: 0, data: { is_featured: newVal }, message: newVal ? '已推荐' : '已取消推荐' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.put('/contents/:id/pin', auth, requireRole('admin'), (req, res) => {
  try {
    const content = db.prepare('SELECT is_pinned FROM contents WHERE id = ?').get(req.params.id);
    if (!content) {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }

    const newVal = content.is_pinned ? 0 : 1;
    const now = new Date().toISOString();
    db.prepare('UPDATE contents SET is_pinned = ?, updated_at = ? WHERE id = ?').run(newVal, now, req.params.id);

    res.json({ code: 0, data: { is_pinned: newVal }, message: newVal ? '已置顶' : '已取消置顶' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.post('/hotlist', auth, requireRole('admin'), (req, res) => {
  try {
    const { content_id, rank_position, boosted_score, reason } = req.body;

    if (!content_id) {
      return res.status(400).json({ code: 1, message: '内容ID不能为空' });
    }

    const content = db.prepare('SELECT id FROM contents WHERE id = ?').get(content_id);
    if (!content) {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO hot_list (id, content_id, rank_position, boosted_score, reason, operated_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, content_id, rank_position || null, boosted_score || 0, reason || null, req.user.id, now);

    res.json({ code: 0, data: null, message: '热榜干预成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/sensitive-words', auth, requireRole('admin'), (req, res) => {
  try {
    const words = db.prepare('SELECT * FROM sensitive_words ORDER BY severity DESC, category ASC').all();
    res.json({ code: 0, data: words, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.post('/sensitive-words', auth, requireRole('admin'), (req, res) => {
  try {
    const { word, category, severity } = req.body;

    if (!word) {
      return res.status(400).json({ code: 1, message: '敏感词不能为空' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO sensitive_words (id, word, category, severity, is_enabled, created_at) VALUES (?, ?, ?, ?, 1, ?)'
    ).run(id, word, category || 'general', severity || 'medium', now);

    const sw = db.prepare('SELECT * FROM sensitive_words WHERE id = ?').get(id);
    res.json({ code: 0, data: sw, message: '添加成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ code: 1, message: '敏感词已存在' });
    }
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.delete('/sensitive-words/:id', auth, requireRole('admin'), (req, res) => {
  try {
    const sw = db.prepare('SELECT * FROM sensitive_words WHERE id = ?').get(req.params.id);
    if (!sw) {
      return res.status(404).json({ code: 1, message: '敏感词不存在' });
    }

    db.prepare('DELETE FROM sensitive_words WHERE id = ?').run(req.params.id);
    res.json({ code: 0, data: null, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/analytics', auth, requireRole('admin'), (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    let dateFilter = "date(created_at) = date('now')";
    if (period === 'weekly') {
      dateFilter = "created_at >= datetime('now', '-7 days')";
    } else if (period === 'monthly') {
      dateFilter = "created_at >= datetime('now', '-30 days')";
    }

    const newUsers = db.prepare(`SELECT COUNT(*) as cnt FROM users WHERE ${dateFilter}`).get().cnt;
    const newContents = db.prepare(`SELECT COUNT(*) as cnt FROM contents WHERE ${dateFilter}`).get().cnt;
    const newComments = db.prepare(`SELECT COUNT(*) as cnt FROM comments WHERE ${dateFilter}`).get().cnt;
    const newTips = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM tips WHERE ${dateFilter}`).get().total;
    const newAdRevenue = db.prepare(`SELECT COALESCE(SUM(revenue), 0) as total FROM ad_revenues WHERE ${dateFilter}`).get().total;

    const topContents = db.prepare(`
      SELECT c.id, c.title, c.like_count, c.view_count, c.comment_count, u.nickname as author_nickname
      FROM contents c
      JOIN users u ON c.user_id = u.id
      WHERE c.status = 'active' AND ${dateFilter.replace('created_at', 'c.created_at')}
      ORDER BY c.like_count DESC, c.view_count DESC
      LIMIT 10
    `).all();

    const topAuthors = db.prepare(`
      SELECT u.id, u.nickname, u.content_count, u.like_count, u.follower_count
      FROM users u
      WHERE u.status = 'active'
      ORDER BY u.like_count DESC
      LIMIT 10
    `).all();

    res.json({
      code: 0,
      data: {
        period,
        stats: { newUsers, newContents, newComments, newTips, newAdRevenue },
        topContents,
        topAuthors
      },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/users', auth, requireRole('admin'), (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, role } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const users = db.prepare(query).all(...params);
    const safeUsers = users.map(u => {
      const { password_hash, ...rest } = u;
      return rest;
    });

    res.json({ code: 0, data: { list: safeUsers, page: parseInt(page), pageSize: parseInt(pageSize) }, message: 'ok' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.put('/users/:id/role', auth, requireRole('admin'), (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'author', 'admin'].includes(role)) {
      return res.status(400).json({ code: 1, message: '无效的角色' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, now, req.params.id);

    res.json({ code: 0, data: null, message: '角色已更新' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.put('/users/:id/status', auth, requireRole('admin'), (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'banned', 'muted'].includes(status)) {
      return res.status(400).json({ code: 1, message: '无效的状态' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id);

    res.json({ code: 0, data: null, message: '状态已更新' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

module.exports = router;
