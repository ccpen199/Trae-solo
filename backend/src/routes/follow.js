const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { query, queryOne, execute } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const follows = await query(
      `SELECT f.*, s.name, s.avatar, s.description, s.followers
       FROM follows f
       LEFT JOIN shops s ON f.shop_id = s.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(pageSize), offset]
    );

    const countResult = await queryOne(
      'SELECT COUNT(*) as count FROM follows WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: '获取成功',
      data: {
        list: follows,
        total: countResult.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    console.error('获取关注列表失败:', err);
    res.json({ success: false, message: '获取失败', data: { list: [], total: 0, page: 1, pageSize: 20 } });
  }
});

router.post('/toggle', authMiddleware, async (req, res) => {
  try {
    const { shopId } = req.body;

    if (!shopId) {
      return res.json({ success: false, message: '参数错误', data: null });
    }

    const existing = await queryOne(
      'SELECT * FROM follows WHERE user_id = ? AND shop_id = ?',
      [req.user.id, shopId]
    );

    let isFollow = false;

    if (existing) {
      await execute('DELETE FROM follows WHERE id = ?', [existing.id]);
      await execute('UPDATE shops SET followers = followers - 1 WHERE id = ?', [shopId]);
      isFollow = false;
    } else {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
      await execute(
        'INSERT INTO follows (id, user_id, shop_id, created_at) VALUES (?, ?, ?, ?)',
        [uuidv4(), req.user.id, shopId, now]
      );
      await execute('UPDATE shops SET followers = followers + 1 WHERE id = ?', [shopId]);
      isFollow = true;
    }

    res.json({
      success: true,
      message: existing ? '已取消关注' : '已关注',
      data: { is_follow: isFollow }
    });
  } catch (err) {
    console.error('关注操作失败:', err);
    res.json({ success: false, message: '操作失败', data: null });
  }
});

module.exports = router;
