const express = require('express');
const { body, validationResult } = require('express-validator');
const { run, get, all } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const generateRoomNo = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { room_type = 'multi', filter_gender, page = 1, limit = 20 } = req.query;
    
    let sql = `
      SELECT r.*, u.nickname as owner_name, u.avatar as owner_avatar
      FROM rooms r
      LEFT JOIN users u ON r.owner_id = u.id
      WHERE r.status = 'waiting'
    `;
    const params = [];

    if (room_type && room_type !== 'all') {
      sql += ' AND r.room_type = ?';
      params.push(room_type);
    }

    if (filter_gender && filter_gender !== 'any') {
      sql += ' AND r.filter_gender IN (?, ?)';
      params.push(filter_gender, 'any');
    }

    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const rooms = await all(sql, params);

    const roomsWithMembers = await Promise.all(rooms.map(async (room) => {
      const members = await all(`
        SELECT u.id, u.nickname, u.avatar, u.gender, rm.is_owner
        FROM room_members rm
        LEFT JOIN users u ON rm.user_id = u.id
        WHERE rm.room_id = ?
      `, [room.id]);
      return { ...room, members };
    }));

    res.json({
      success: true,
      data: {
        rooms: roomsWithMembers,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取房间列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取房间列表失败'
    });
  }
});

router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await get(`
      SELECT r.*, u.nickname as owner_name, u.avatar as owner_avatar
      FROM rooms r
      LEFT JOIN users u ON r.owner_id = u.id
      WHERE r.id = ?
    `, [roomId]);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: '房间不存在'
      });
    }

    const members = await all(`
      SELECT u.id, u.nickname, u.avatar, u.gender, u.is_online, rm.is_owner, rm.join_order
      FROM room_members rm
      LEFT JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = ?
      ORDER BY rm.join_order ASC
    `, [roomId]);

    const messages = await all(`
      SELECT rm.*, u.nickname, u.avatar
      FROM room_messages rm
      LEFT JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = ?
      ORDER BY rm.created_at DESC LIMIT 50
    `, [roomId]);

    res.json({
      success: true,
      data: {
        room,
        members,
        messages: messages.reverse()
      }
    });
  } catch (error) {
    console.error('获取房间详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取房间详情失败'
    });
  }
});

router.post('/', authMiddleware, [
  body('room_type').isIn(['1v1', 'multi']).withMessage('无效的房间类型'),
  body('room_name').isString().notEmpty().withMessage('房间名称不能为空'),
  body('is_public').optional().isBoolean(),
  body('password').optional().isString(),
  body('max_members').optional().isInt({ min: 2, max: 20 }),
  body('filter_gender').optional().isIn(['male', 'female', 'any']),
  body('movie_id').optional().isInt(),
  body('movie_title').optional().isString(),
  body('movie_poster').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const userId = req.user.id;
    const { room_type, room_name, is_public = true, password, max_members = 8, filter_gender = 'any', movie_id, movie_title, movie_poster } = req.body;

    const existingMembership = await get('SELECT * FROM room_members WHERE user_id = ?', [userId]);
    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: '您已在其他房间中，请先退出'
      });
    }

    const room_no = generateRoomNo();
    
    const result = await run(`
      INSERT INTO rooms (room_no, room_type, room_name, is_public, password, owner_id, max_members, filter_gender, current_movie_id, current_movie_title, current_movie_poster)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [room_no, room_type, room_name, is_public ? 1 : 0, password || null, userId, max_members, filter_gender, movie_id || null, movie_title || '', movie_poster || '']);

    const roomId = result.lastID;
    
    await run('INSERT INTO room_members (room_id, user_id, join_order, is_owner) VALUES (?, ?, 1, 1)', [roomId, userId]);

    const room = await get('SELECT * FROM rooms WHERE id = ?', [roomId]);

    res.json({
      success: true,
      data: { room },
      message: '房间创建成功'
    });
  } catch (error) {
    console.error('创建房间错误:', error);
    res.status(500).json({
      success: false,
      message: '创建房间失败'
    });
  }
});

router.post('/:roomId/join', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { password } = req.body;

    const room = await get('SELECT * FROM rooms WHERE id = ?', [roomId]);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: '房间不存在'
      });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: '房间已关闭或正在播放中'
      });
    }

    if (room.password && room.password !== password) {
      return res.status(400).json({
        success: false,
        message: '密码错误'
      });
    }

    if (room.filter_gender !== 'any' && room.filter_gender !== req.user.gender) {
      return res.status(400).json({
        success: false,
        message: '不符合房间性别筛选条件'
      });
    }

    const existingMembership = await get('SELECT * FROM room_members WHERE user_id = ?', [userId]);
    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: '您已在其他房间中'
      });
    }

    const currentMemberCount = await get('SELECT COUNT(*) as count FROM room_members WHERE room_id = ?', [roomId]);
    if (currentMemberCount.count >= room.max_members) {
      return res.status(400).json({
        success: false,
        message: '房间已满'
      });
    }

    const maxJoinOrder = await get('SELECT MAX(join_order) as max_order FROM room_members WHERE room_id = ?', [roomId]);
    
    await run(
      'INSERT INTO room_members (room_id, user_id, join_order, is_owner) VALUES (?, ?, ?, 0)',
      [roomId, userId, (maxJoinOrder.max_order || 0) + 1]
    );

    await run('UPDATE rooms SET member_count = member_count + 1 WHERE id = ?', [roomId]);

    await run(
      'INSERT INTO room_messages (room_id, user_id, message_type, content) VALUES (?, ?, ?, ?)',
      [roomId, userId, 'system', `${req.user.nickname} 加入了房间`]
    );

    res.json({
      success: true,
      message: '加入房间成功'
    });
  } catch (error) {
    console.error('加入房间错误:', error);
    res.status(500).json({
      success: false,
      message: '加入房间失败'
    });
  }
});

router.post('/:roomId/leave', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const membership = await get('SELECT * FROM room_members WHERE room_id = ? AND user_id = ?', [roomId, userId]);
    if (!membership) {
      return res.status(400).json({
        success: false,
        message: '您不在此房间中'
      });
    }

    await run('DELETE FROM room_members WHERE room_id = ? AND user_id = ?', [roomId, userId]);
    
    const remainingMembers = await all('SELECT * FROM room_members WHERE room_id = ? ORDER BY join_order ASC', [roomId]);

    if (remainingMembers.length === 0) {
      await run('UPDATE rooms SET status = ? WHERE id = ?', ['closed', roomId]);
    } else if (membership.is_owner) {
      const newOwner = remainingMembers[0];
      await run('UPDATE room_members SET is_owner = 1 WHERE id = ?', [newOwner.id]);
      await run('UPDATE rooms SET owner_id = ? WHERE id = ?', [newOwner.user_id, roomId]);
      
      const newOwnerUser = await get('SELECT nickname FROM users WHERE id = ?', [newOwner.user_id]);
      await run(
        'INSERT INTO room_messages (room_id, user_id, message_type, content) VALUES (?, ?, ?, ?)',
        [roomId, userId, 'system', `${newOwnerUser.nickname} 成为新房主`]
      );
    }

    await run('UPDATE rooms SET member_count = member_count - 1 WHERE id = ?', [roomId]);

    await run(
      'INSERT INTO room_messages (room_id, user_id, message_type, content) VALUES (?, ?, ?, ?)',
      [roomId, userId, 'system', `${req.user.nickname} 离开了房间`]
    );

    res.json({
      success: true,
      message: '退出房间成功'
    });
  } catch (error) {
    console.error('退出房间错误:', error);
    res.status(500).json({
      success: false,
      message: '退出房间失败'
    });
  }
});

router.post('/:roomId/kick/:targetUserId', authMiddleware, async (req, res) => {
  try {
    const { roomId, targetUserId } = req.params;
    const userId = req.user.id;

    const room = await get('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (!room || room.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '您没有权限'
      });
    }

    if (parseInt(targetUserId) === userId) {
      return res.status(400).json({
        success: false,
        message: '不能踢出自己'
      });
    }

    const targetMembership = await get('SELECT * FROM room_members WHERE room_id = ? AND user_id = ?', [roomId, targetUserId]);
    if (!targetMembership) {
      return res.status(400).json({
        success: false,
        message: '用户不在此房间中'
      });
    }

    await run('DELETE FROM room_members WHERE room_id = ? AND user_id = ?', [roomId, targetUserId]);
    await run('UPDATE rooms SET member_count = member_count - 1 WHERE id = ?', [roomId]);

    const targetUser = await get('SELECT nickname FROM users WHERE id = ?', [targetUserId]);
    await run(
      'INSERT INTO room_messages (room_id, user_id, message_type, content) VALUES (?, ?, ?, ?)',
      [roomId, userId, 'system', `${targetUser.nickname} 被踢出房间`]
    );

    res.json({
      success: true,
      message: '踢出成功'
    });
  } catch (error) {
    console.error('踢出用户错误:', error);
    res.status(500).json({
      success: false,
      message: '踢出失败'
    });
  }
});

router.post('/:roomId/message', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { content, message_type = 'text' } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    const membership = await get('SELECT * FROM room_members WHERE room_id = ? AND user_id = ?', [roomId, userId]);
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: '您不在此房间中'
      });
    }

    await run(
      'INSERT INTO room_messages (room_id, user_id, message_type, content) VALUES (?, ?, ?, ?)',
      [roomId, userId, message_type, content]
    );

    res.json({
      success: true,
      message: '发送成功'
    });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({
      success: false,
      message: '发送失败'
    });
  }
});

module.exports = router;
