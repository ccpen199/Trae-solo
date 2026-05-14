const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { query, queryOne, execute } = require('../database');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/list', optionalAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, shopId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let sql = `SELECT d.*, s.name as shop_name, s.avatar as shop_avatar
               FROM shop_dynamics d
               LEFT JOIN shops s ON d.shop_id = s.id
               WHERE 1=1`;
    let countSql = 'SELECT COUNT(*) as count FROM shop_dynamics WHERE 1=1';
    const params = [];
    const countParams = [];

    if (shopId) {
      sql += ' AND d.shop_id = ?';
      countSql += ' AND shop_id = ?';
      params.push(shopId);
      countParams.push(shopId);
    } else if (req.user) {
      const follows = await query('SELECT shop_id FROM follows WHERE user_id = ?', [req.user.id]);
      if (follows.length > 0) {
        const placeholders = follows.map(() => '?').join(',');
        sql += ` AND d.shop_id IN (${placeholders})`;
        countSql += ` AND shop_id IN (${placeholders})`;
        const shopIds = follows.map(f => f.shop_id);
        params.push(...shopIds);
        countParams.push(...shopIds);
      }
    }

    sql += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const dynamics = await query(sql, params);
    const countResult = await queryOne(countSql, countParams);

    const processedDynamics = dynamics.map(d => ({
      ...d,
      images: d.images ? JSON.parse(d.images) : []
    }));

    res.json({
      success: true,
      message: '获取成功',
      data: {
        list: processedDynamics,
        total: countResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    console.error('获取动态列表失败:', err);
    res.json({ success: false, message: '获取失败', data: { list: [], total: 0, page: 1, pageSize: 20 } });
  }
});

router.get('/detail/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const dynamic = await queryOne(
      `SELECT d.*, s.name as shop_name, s.avatar as shop_avatar, s.followers
       FROM shop_dynamics d
       LEFT JOIN shops s ON d.shop_id = s.id
       WHERE d.id = ?`,
      [id]
    );

    if (!dynamic) {
      return res.json({ success: false, message: '动态不存在', data: null });
    }

    let isFollowShop = false;
    if (req.user) {
      const follow = await queryOne(
        'SELECT * FROM follows WHERE user_id = ? AND shop_id = ?',
        [req.user.id, dynamic.shop_id]
      );
      isFollowShop = !!follow;
    }

    res.json({
      success: true,
      message: '获取成功',
      data: {
        ...dynamic,
        images: dynamic.images ? JSON.parse(dynamic.images) : [],
        is_follow_shop: isFollowShop
      }
    });
  } catch (err) {
    console.error('获取动态详情失败:', err);
    res.json({ success: false, message: '获取失败', data: null });
  }
});

router.post('/like', authMiddleware, async (req, res) => {
  try {
    const { dynamicId } = req.body;

    if (!dynamicId) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    await execute('UPDATE shop_dynamics SET likes = likes + 1 WHERE id = ?', [dynamicId]);

    res.json({ success: true, message: '点赞成功', data: null });
  } catch (err) {
    console.error('点赞失败:', err);
    res.json({ success: false, message: '操作失败', data: null });
  }
});

module.exports = router;
