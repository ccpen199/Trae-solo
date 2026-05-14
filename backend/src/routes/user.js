const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { query, queryOne, execute } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在', data: null });
    }

    const [orderStats, favoriteCount, followCount] = await Promise.all([
      queryOne(`SELECT 
        SUM(CASE WHEN pay_status = 'unpaid' THEN 1 ELSE 0 END) as unpaid,
        SUM(CASE WHEN pay_status = 'paid' AND status IN ('paid', 'processing') THEN 1 ELSE 0 END) as unshipped,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as unreceived,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM orders WHERE user_id = ?`, [req.user.id]),
      queryOne('SELECT COUNT(*) as count FROM favorites WHERE user_id = ?', [req.user.id]),
      queryOne('SELECT COUNT(*) as count FROM follows WHERE user_id = ?', [req.user.id])
    ]);

    res.json({
      success: true,
      message: '获取成功',
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        balance: user.balance,
        coupons: user.coupons,
        vip: user.vip,
        order_stats: {
          unpaid: orderStats.unpaid || 0,
          unshipped: orderStats.unshipped || 0,
          unreceived: orderStats.unreceived || 0,
          completed: orderStats.completed || 0
        },
        favorite_count: favoriteCount.count,
        follow_count: followCount.count
      }
    });
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.json({ success: false, message: '获取失败', data: null });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, avatar } = req.body;

    const updates = [];
    const params = [];

    if (nickname) {
      updates.push('nickname = ?');
      params.push(nickname);
    }

    if (avatar) {
      updates.push('avatar = ?');
      params.push(avatar);
    }

    if (updates.length === 0) {
      return res.json({ success: false, message: '没有要更新的内容', data: null });
    }

    updates.push('updated_at = ?');
    params.push(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    params.push(req.user.id);

    await execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: '更新成功', data: null });
  } catch (err) {
    console.error('更新用户信息失败:', err);
    res.json({ success: false, message: '更新失败', data: null });
  }
});

module.exports = router;
