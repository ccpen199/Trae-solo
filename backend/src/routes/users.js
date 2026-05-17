const express = require('express');
const { runQuery, runGet, runRun } = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const user = await runGet('SELECT id, nickname, avatar, bio, location, created_at FROM users WHERE id = ?', [req.params.id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const pets = await runQuery('SELECT * FROM pets WHERE user_id = ?', [req.params.id]);
    user.pets = pets;

    const { post_count } = await runGet('SELECT COUNT(*) as post_count FROM posts WHERE user_id = ?', [req.params.id]);
    const { follower_count } = await runGet('SELECT COUNT(*) as follower_count FROM follows WHERE following_id = ?', [req.params.id]);
    const { following_count } = await runGet('SELECT COUNT(*) as following_count FROM follows WHERE follower_id = ?', [req.params.id]);

    user.stats = {
      post_count,
      follower_count,
      following_count
    };

    if (req.user) {
      const followed = await runGet('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, req.params.id]);
      user.is_followed = !!followed;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/:id/follow', authMiddleware, async (req, res) => {
  try {
    const followingId = req.params.id;
    const followerId = req.user.id;

    if (parseInt(followingId) === followerId) {
      return res.status(400).json({
        success: false,
        message: '不能关注自己'
      });
    }

    const existing = await runGet('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId]);

    if (existing) {
      await runRun('DELETE FROM follows WHERE id = ?', [existing.id]);
      res.json({ success: true, data: { followed: false } });
    } else {
      await runRun('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [followerId, followingId]);
      res.json({ success: true, data: { followed: true } });
    }
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/:id/posts', optionalAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const posts = await runQuery(`
      SELECT p.*, u.nickname, u.avatar
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.params.id, parseInt(pageSize), offset]);

    const { total } = await runGet('SELECT COUNT(*) as total FROM posts WHERE user_id = ?', [req.params.id]);

    res.json({
      success: true,
      data: {
        list: posts,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/:id/adoptions', authMiddleware, async (req, res) => {
  try {
    const pets = await runQuery('SELECT * FROM pets WHERE user_id = ? AND for_adoption = 1', [req.params.id]);
    res.json({
      success: true,
      data: pets
    });
  } catch (error) {
    console.error('Get adoptions error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/adoptions', authMiddleware, async (req, res) => {
  try {
    const { pet_id, message } = req.body;

    const pet = await runGet('SELECT * FROM pets WHERE id = ?', [pet_id]);
    if (!pet || !pet.for_adoption) {
      return res.status(400).json({
        success: false,
        message: '该宠物不可领养'
      });
    }

    const existing = await runGet('SELECT id FROM adoptions WHERE user_id = ? AND pet_id = ?', [req.user.id, pet_id]);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: '已提交领养申请'
      });
    }

    await runRun('INSERT INTO adoptions (user_id, pet_id, message) VALUES (?, ?, ?)', [req.user.id, pet_id, message || '']);

    res.json({
      success: true,
      message: '领养申请已提交'
    });
  } catch (error) {
    console.error('Submit adoption error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/report', authMiddleware, async (req, res) => {
  try {
    const { target_type, target_id, reason } = req.body;

    await runRun('INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)', [req.user.id, target_type, target_id, reason]);

    res.json({
      success: true,
      message: '举报已提交'
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
