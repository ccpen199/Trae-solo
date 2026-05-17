const express = require('express');
const { query, queryOne, run } = require('../database');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/rooms', optionalAuthMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, is_live } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (category) {
      whereClause += ' AND lr.category_id = ?';
      params.push(category);
    }

    if (is_live !== undefined) {
      whereClause += ' AND lr.is_live = ?';
      params.push(is_live === 'true' ? 1 : 0);
    }

    const rooms = await query(`
      SELECT lr.*, u.nickname, u.avatar, u.level, c.name as category_name
      FROM live_rooms lr
      LEFT JOIN users u ON lr.anchor_id = u.id
      LEFT JOIN categories c ON lr.category_id = c.id
      ${whereClause}
      ORDER BY lr.is_live DESC, lr.viewer_count DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalResult = await queryOne(`
      SELECT COUNT(*) as total FROM live_rooms lr ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        list: rooms,
        total: totalResult.total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取直播间列表失败'
    });
  }
});

router.get('/rooms/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const room = await queryOne(`
      SELECT lr.*, u.nickname, u.avatar, u.level, u.bio, c.name as category_name
      FROM live_rooms lr
      LEFT JOIN users u ON lr.anchor_id = u.id
      LEFT JOIN categories c ON lr.category_id = c.id
      WHERE lr.id = ?
    `, [req.params.id]);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: '直播间不存在'
      });
    }

    let is_following = false;
    if (req.user) {
      const follow = await queryOne(
        'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?',
        [req.user.id, room.anchor_id]
      );
      is_following = !!follow;
    }

    res.json({
      success: true,
      data: {
        ...room,
        is_following
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取直播间信息失败'
    });
  }
});

router.post('/rooms', authMiddleware, async (req, res) => {
  try {
    const { title, cover, description, category_id } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: '直播间标题不能为空'
      });
    }

    const existingRoom = await queryOne(
      'SELECT id FROM live_rooms WHERE anchor_id = ? AND is_live = 1',
      [req.user.id]
    );

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: '您已有正在直播的房间'
      });
    }

    const result = await run(
      'INSERT INTO live_rooms (anchor_id, title, cover, description, category_id, is_live, start_time) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)',
      [req.user.id, title.trim(), cover || null, description || null, category_id || null]
    );

    const room = await queryOne(`
      SELECT lr.*, u.nickname, u.avatar
      FROM live_rooms lr
      LEFT JOIN users u ON lr.anchor_id = u.id
      WHERE lr.id = ?
    `, [result.lastID]);

    res.json({
      success: true,
      message: '直播间创建成功',
      data: room
    });
  } catch (error) {
    console.error('创建直播间错误:', error);
    res.status(500).json({
      success: false,
      message: '创建直播间失败'
    });
  }
});

router.put('/rooms/:id/status', authMiddleware, async (req, res) => {
  try {
    const { is_live } = req.body;
    const roomId = req.params.id;

    const room = await queryOne('SELECT * FROM live_rooms WHERE id = ?', [roomId]);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: '直播间不存在'
      });
    }

    if (room.anchor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权操作此直播间'
      });
    }

    if (is_live) {
      await run('UPDATE live_rooms SET is_live = 1, start_time = CURRENT_TIMESTAMP WHERE id = ?', [roomId]);
    } else {
      await run('UPDATE live_rooms SET is_live = 0, end_time = CURRENT_TIMESTAMP WHERE id = ?', [roomId]);
    }

    res.json({
      success: true,
      message: is_live ? '开始直播' : '结束直播'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.get('/rooms/:id/chat', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const messages = await query(`
      SELECT lc.*, u.nickname, u.avatar, u.level
      FROM live_chat lc
      LEFT JOIN users u ON lc.user_id = u.id
      WHERE lc.room_id = ?
      ORDER BY lc.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.params.id, parseInt(limit), offset]);

    res.json({
      success: true,
      data: messages.reverse()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取聊天记录失败'
    });
  }
});

router.post('/rooms/:id/chat', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    await run(
      'INSERT INTO live_chat (room_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, content.trim()]
    );

    res.json({
      success: true,
      message: '发送消息成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发送消息失败'
    });
  }
});

router.get('/gifts', async (req, res) => {
  try {
    const gifts = await query(
      'SELECT * FROM live_gifts WHERE is_active = 1 ORDER BY sort_order, price'
    );

    res.json({
      success: true,
      data: gifts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取礼物列表失败'
    });
  }
});

router.post('/rooms/:id/gifts', authMiddleware, async (req, res) => {
  try {
    const { gift_id, count = 1, message } = req.body;

    const gift = await queryOne('SELECT * FROM live_gifts WHERE id = ?', [gift_id]);

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: '礼物不存在'
      });
    }

    const totalPrice = gift.price * count;
    const user = await queryOne('SELECT fish_dried FROM users WHERE id = ?', [req.user.id]);

    if (user.fish_dried < totalPrice) {
      return res.status(400).json({
        success: false,
        message: '小鱼干不足'
      });
    }

    const room = await queryOne('SELECT anchor_id FROM live_rooms WHERE id = ?', [req.params.id]);

    await run('UPDATE users SET fish_dried = fish_dried - ? WHERE id = ?', [totalPrice, req.user.id]);
    await run(
      'INSERT INTO live_gift_records (room_id, sender_id, receiver_id, gift_id, gift_name, gift_count, total_price, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.params.id, req.user.id, room.anchor_id, gift_id, gift.name, count, totalPrice, message || null]
    );

    res.json({
      success: true,
      message: '赠送礼物成功',
      data: { totalPrice }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '赠送礼物失败'
    });
  }
});

router.get('/rooms/:id/gift-records', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const records = await query(`
      SELECT r.*, u.nickname as sender_nickname, u.avatar as sender_avatar
      FROM live_gift_records r
      LEFT JOIN users u ON r.sender_id = u.id
      WHERE r.room_id = ?
      ORDER BY r.created_at DESC
      LIMIT ?
    `, [req.params.id, parseInt(limit)]);

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取礼物记录失败'
    });
  }
});

module.exports = router;
