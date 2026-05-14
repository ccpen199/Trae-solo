const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { query, queryOne, execute } = require('../database');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/list', optionalAuth, async (req, res) => {
  try {
    const { status = 'live', page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const lives = await query(
      `SELECT l.*, s.name as shop_name, s.avatar as shop_avatar
       FROM lives l
       LEFT JOIN shops s ON l.shop_id = s.id
       WHERE l.status = ?
       ORDER BY l.viewers DESC
       LIMIT ? OFFSET ?`,
      [status, parseInt(pageSize), offset]
    );

    const countResult = await queryOne(
      'SELECT COUNT(*) as count FROM lives WHERE status = ?',
      [status]
    );

    res.json({
      success: true,
      message: '获取成功',
      data: {
        list: lives,
        total: countResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    console.error('获取直播列表失败:', err);
    res.json({ success: false, message: '获取失败', data: { list: [], total: 0, page: 1, pageSize: 20 } });
  }
});

router.get('/detail/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const live = await queryOne(
      `SELECT l.*, s.name as shop_name, s.avatar as shop_avatar, s.description as shop_description, s.followers
       FROM lives l
       LEFT JOIN shops s ON l.shop_id = s.id
       WHERE l.id = ?`,
      [id]
    );

    if (!live) {
      return res.json({ success: false, message: '直播不存在', data: null });
    }

    let isFollowShop = false;
    if (req.user) {
      const follow = await queryOne(
        'SELECT * FROM follows WHERE user_id = ? AND shop_id = ?',
        [req.user.id, live.shop_id]
      );
      isFollowShop = !!follow;
    }

    const products = await query(
      'SELECT * FROM products WHERE shop_id = ? ORDER BY sales DESC LIMIT 10',
      [live.shop_id]
    );

    res.json({
      success: true,
      message: '获取成功',
      data: {
        ...live,
        is_follow_shop: isFollowShop,
        products
      }
    });
  } catch (err) {
    console.error('获取直播详情失败:', err);
    res.json({ success: false, message: '获取失败', data: null });
  }
});

router.post('/like', authMiddleware, async (req, res) => {
  try {
    const { liveId } = req.body;

    if (!liveId) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    await execute('UPDATE lives SET likes = likes + 1 WHERE id = ?', [liveId]);

    res.json({ success: true, message: '点赞成功', data: null });
  } catch (err) {
    console.error('点赞失败:', err);
    res.json({ success: false, message: '操作失败', data: null });
  }
});

router.post('/enter', authMiddleware, async (req, res) => {
  try {
    const { liveId } = req.body;

    if (!liveId) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    await execute('UPDATE lives SET viewers = viewers + 1 WHERE id = ?', [liveId]);

    res.json({ success: true, message: '进入直播间成功', data: null });
  } catch (err) {
    console.error('进入直播间失败:', err);
    res.json({ success: false, message: '操作失败', data: null });
  }
});

module.exports = router;
