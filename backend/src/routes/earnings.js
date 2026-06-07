const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { auth } = require('../middleware/auth');

router.post('/tip', auth, (req, res) => {
  try {
    const { content_id, amount, message } = req.body;

    if (!content_id || !amount || amount <= 0) {
      return res.status(400).json({ code: 1, message: '内容ID和打赏金额不能为空' });
    }

    const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(content_id);
    if (!content) {
      return res.status(404).json({ code: 1, message: '内容不存在' });
    }

    if (content.user_id === req.user.id) {
      return res.status(400).json({ code: 1, message: '不能打赏自己的内容' });
    }

    const author = db.prepare('SELECT * FROM users WHERE id = ?').get(content.user_id);
    const creatorLevel = db.prepare('SELECT * FROM creator_levels WHERE id = ?').get(author.creator_level || 1);
    const tipShareRate = creatorLevel ? creatorLevel.tip_share_rate : 0.7;

    const authorEarning = Math.round(amount * tipShareRate * 100) / 100;

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO tips (id, from_user_id, to_user_id, content_id, amount, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, \'completed\', ?)'
    ).run(id, req.user.id, content.user_id, content_id, amount, message || null, now);

    db.prepare('UPDATE contents SET tip_earnings = tip_earnings + ? WHERE id = ?').run(authorEarning, content_id);
    db.prepare('UPDATE users SET total_earnings = total_earnings + ? WHERE id = ?').run(authorEarning, content.user_id);
    db.prepare('UPDATE users SET creator_score = creator_score + 5 WHERE id = ?').run(content.user_id);

    const notifId = uuidv4();
    db.prepare(
      'INSERT INTO notifications (id, user_id, type, title, body, related_id, is_read, created_at) VALUES (?, ?, \'tip\', ?, ?, ?, 0, ?)'
    ).run(notifId, content.user_id, '收到打赏', `您的内容收到 ${amount} 元打赏`, content_id, now);

    res.json({ code: 0, data: { tip_amount: amount, author_earning: authorEarning, share_rate: tipShareRate }, message: '打赏成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/my', auth, (req, res) => {
  try {
    const userId = req.user.id;

    const tipEarnings = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM tips WHERE to_user_id = ?').get(userId).total;
    const adEarnings = db.prepare('SELECT COALESCE(SUM(revenue), 0) as total FROM ad_revenues WHERE user_id = ?').get(userId).total;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thisWeekStart = new Date();
    thisWeekStart.setDate(now.getDate() - now.getDay());
    const thisWeekStartStr = thisWeekStart.toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const monthlyTip = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM tips WHERE to_user_id = ? AND created_at >= ?').get(userId, thisMonthStart).total;
    const monthlyAd = db.prepare('SELECT COALESCE(SUM(revenue), 0) as total FROM ad_revenues WHERE user_id = ? AND created_at >= ?').get(userId, thisMonthStart).total;
    const monthlyEarnings = Math.round((monthlyTip + monthlyAd) * 100) / 100;

    const weeklyTip = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM tips WHERE to_user_id = ? AND created_at >= ?').get(userId, thisWeekStartStr).total;
    const weeklyAd = db.prepare('SELECT COALESCE(SUM(revenue), 0) as total FROM ad_revenues WHERE user_id = ? AND created_at >= ?').get(userId, thisWeekStartStr).total;
    const weeklyEarnings = Math.round((weeklyTip + weeklyAd) * 100) / 100;

    const dailyTip = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM tips WHERE to_user_id = ? AND created_at >= ?').get(userId, todayStart).total;
    const dailyAd = db.prepare('SELECT COALESCE(SUM(revenue), 0) as total FROM ad_revenues WHERE user_id = ? AND created_at >= ?').get(userId, todayStart).total;
    const dailyEarnings = Math.round((dailyTip + dailyAd) * 100) / 100;

    const user = db.prepare(`
      SELECT u.*, cl.name as level_name, cl.min_score, cl.max_score, cl.ad_share_rate, cl.tip_share_rate
      FROM users u
      LEFT JOIN creator_levels cl ON u.creator_level = cl.id
      WHERE u.id = ?
    `).get(userId);

    const contentCount = db.prepare('SELECT COUNT(*) as cnt FROM contents WHERE user_id = ? AND status = \'active\'').get(userId).cnt;
    const totalLikes = db.prepare('SELECT COALESCE(SUM(like_count), 0) as total FROM contents WHERE user_id = ?').get(userId).total;
    const totalComments = db.prepare('SELECT COALESCE(SUM(comment_count), 0) as total FROM contents WHERE user_id = ?').get(userId).total;
    const totalViews = db.prepare('SELECT COALESCE(SUM(view_count), 0) as total FROM contents WHERE user_id = ?').get(userId).total;

    const availableEarnings = Math.round((user.total_earnings || 0) * 0.8 * 100) / 100;

    res.json({
      code: 0,
      data: {
        total_earnings: user.total_earnings || 0,
        tip_earnings: tipEarnings,
        ad_earnings: adEarnings,
        monthly_earnings: monthlyEarnings,
        weekly_earnings: weeklyEarnings,
        daily_earnings: dailyEarnings,
        available_earnings: availableEarnings,
        creator_level: user.creator_level,
        creator_level_name: user.level_name,
        creator_score: user.creator_score,
        min_score: user.min_score,
        max_score: user.max_score,
        ad_share_rate: user.ad_share_rate,
        tip_share_rate: user.tip_share_rate,
        content_count: contentCount,
        total_likes: totalLikes,
        total_comments: totalComments,
        total_views: totalViews,
        is_certified: user.is_certified,
        certified_at: user.certified_at
      },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/stats', auth, (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'daily' } = req.query;

    let dateFormat, groupBy, limit;
    if (period === 'weekly') {
      dateFormat = "strftime('%Y-%W', created_at)";
      groupBy = 'week';
      limit = 12;
    } else if (period === 'monthly') {
      dateFormat = "strftime('%Y-%m', created_at)";
      groupBy = 'month';
      limit = 12;
    } else {
      dateFormat = "strftime('%Y-%m-%d', created_at)";
      groupBy = 'day';
      limit = 30;
    }

    const tipStats = db.prepare(`
      SELECT ${dateFormat} as period, COALESCE(SUM(amount), 0) as tip_amount, COUNT(*) as tip_count
      FROM tips WHERE to_user_id = ?
      GROUP BY ${groupBy} ORDER BY ${groupBy} DESC LIMIT ?
    `).all(userId, limit);

    const adStats = db.prepare(`
      SELECT ${dateFormat} as period, COALESCE(SUM(revenue), 0) as ad_amount, COUNT(*) as ad_count
      FROM ad_revenues WHERE user_id = ?
      GROUP BY ${groupBy} ORDER BY ${groupBy} DESC LIMIT ?
    `).all(userId, limit);

    const contentStats = db.prepare(`
      SELECT ${dateFormat} as period, COUNT(*) as content_count, COALESCE(SUM(like_count), 0) as likes,
             COALESCE(SUM(comment_count), 0) as comments, COALESCE(SUM(view_count), 0) as views
      FROM contents WHERE user_id = ?
      GROUP BY ${groupBy} ORDER BY ${groupBy} DESC LIMIT ?
    `).all(userId, limit);

    const merged = {};
    tipStats.forEach(s => { merged[s.period] = { ...merged[s.period], ...s }; });
    adStats.forEach(s => { merged[s.period] = { ...merged[s.period], ...s }; });
    contentStats.forEach(s => { merged[s.period] = { ...merged[s.period], ...s }; });

    const stats = Object.values(merged).sort((a, b) => b.period.localeCompare(a.period));

    res.json({
      code: 0,
      data: { period, stats: stats },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

router.get('/records', auth, (req, res) => {
  try {
    const { page = 1, pageSize = 20, type = 'all' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const results = [];

    if (type === 'all' || type === 'tip') {
      const tips = db.prepare(`
        SELECT t.*, c.title as content_title, u.nickname as from_nickname
        FROM tips t
        JOIN contents c ON t.content_id = c.id
        JOIN users u ON t.from_user_id = u.id
        WHERE t.to_user_id = ?
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `).all(req.user.id, parseInt(pageSize), offset);
      tips.forEach(t => results.push({ ...t, earning_type: 'tip' }));
    }

    if (type === 'all' || type === 'ad') {
      const ads = db.prepare(`
        SELECT a.*, c.title as content_title
        FROM ad_revenues a
        JOIN contents c ON a.content_id = c.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `).all(req.user.id, parseInt(pageSize), offset);
      ads.forEach(a => results.push({ ...a, earning_type: 'ad' }));
    }

    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      code: 0,
      data: { list: results, page: parseInt(page), pageSize: parseInt(pageSize) },
      message: 'ok'
    });
  } catch (err) {
    res.status(500).json({ code: 1, message: err.message });
  }
});

module.exports = router;
