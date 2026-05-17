const express = require('express');
const { db } = require('../database/init');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/recommendations', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        r.id,
        r.user_id,
        r.song_id,
        r.reason_text,
        r.status,
        r.gif_url,
        r.submitted_at,
        u.nickname as user_nickname,
        s.title as song_title,
        s.artist as song_artist
      FROM recommendations r
      JOIN users u ON r.user_id = u.id
      JOIN songs s ON r.song_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += " AND r.status = ?";
      params.push(status);
    }

    query += " ORDER BY r.submitted_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const recommendations = db.prepare(query).all(...params);

    let countQuery = "SELECT COUNT(*) as count FROM recommendations WHERE 1=1";
    const countParams = [];
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
    console.error('管理员获取推荐列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/recommendations/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { gif_url } = req.body;

    const recommendation = db.prepare('SELECT id FROM recommendations WHERE id = ?').get(id);
    if (!recommendation) {
      return res.status(404).json({ success: false, message: '推荐不存在' });
    }

    db.prepare(`
      UPDATE recommendations 
      SET status = 'approved', gif_url = ?, approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(gif_url || '', id);

    res.json({ success: true, message: '审核通过' });
  } catch (error) {
    console.error('审核推荐错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/recommendations/:id/reject', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;

    const recommendation = db.prepare('SELECT id FROM recommendations WHERE id = ?').get(id);
    if (!recommendation) {
      return res.status(404).json({ success: false, message: '推荐不存在' });
    }

    db.prepare("UPDATE recommendations SET status = 'rejected' WHERE id = ?").run(id);

    res.json({ success: true, message: '已拒绝' });
  } catch (error) {
    console.error('拒绝推荐错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const songCount = db.prepare('SELECT COUNT(*) as count FROM songs').get();
    const recommendationCount = db.prepare("SELECT COUNT(*) as count FROM recommendations WHERE status = 'approved'").get();
    const pendingCount = db.prepare("SELECT COUNT(*) as count FROM recommendations WHERE status = 'pending'").get();

    res.json({
      success: true,
      data: {
        user_count: userCount.count,
        song_count: songCount.count,
        recommendation_count: recommendationCount.count,
        pending_count: pendingCount.count
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
