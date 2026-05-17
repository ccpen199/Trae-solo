const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  try {
    const { filter = 'recommended', userId } = req.query;
    
    let query = `
      SELECT r.*, u.nickname as host_name, u.avatar as host_avatar,
             s.title as story_title, s.difficulty
      FROM rooms r
      JOIN users u ON r.host_id = u.id
      LEFT JOIN stories s ON r.story_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (filter === 'hot') {
      query += ' ORDER BY r.popularity DESC, r.current_players DESC';
    } else if (filter === 'available') {
      query += ' AND r.current_players < r.max_players ORDER BY r.created_at DESC';
    } else {
      query += ` ORDER BY 
        CASE WHEN r.current_players >= r.max_players THEN 1 ELSE 0 END,
        r.popularity DESC,
        r.current_players DESC,
        r.created_at DESC`;
    }

    query += ' LIMIT 50';

    const rooms = db.prepare(query).all(...params);
    
    rooms.forEach(room => {
      const members = db.prepare(`
        SELECT u.id, u.nickname, u.avatar, rm.role
        FROM room_members rm
        JOIN users u ON rm.user_id = u.id
        WHERE rm.room_id = ?
      `).all(room.id);
      room.members = members;
    });

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: '获取房间列表失败'
    });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, type, hostId, maxPlayers = 8 } = req.body;

    if (!name || !type || !hostId) {
      return res.status(400).json({
        success: false,
        message: '缺少必填参数'
      });
    }

    const roomId = uuidv4();
    
    db.prepare(`
      INSERT INTO rooms (id, name, host_id, type, max_players, current_players, status)
      VALUES (?, ?, ?, ?, ?, 1, 'waiting')
    `).run(roomId, name, hostId, type, maxPlayers);

    db.prepare(`
      INSERT INTO room_members (room_id, user_id, role)
      VALUES (?, ?, 'host')
    `).run(roomId, hostId);

    const room = db.prepare(`
      SELECT r.*, u.nickname as host_name, u.avatar as host_avatar
      FROM rooms r
      JOIN users u ON r.host_id = u.id
      WHERE r.id = ?
    `).get(roomId);

    const members = db.prepare(`
      SELECT u.id, u.nickname, u.avatar, rm.role
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = ?
    `).all(roomId);
    room.members = members;

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: '创建房间失败'
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const room = db.prepare(`
      SELECT r.*, u.nickname as host_name, u.avatar as host_avatar,
             s.title as story_title, s.content as story_content,
             s.answer as story_answer, s.difficulty
      FROM rooms r
      JOIN users u ON r.host_id = u.id
      LEFT JOIN stories s ON r.story_id = s.id
      WHERE r.id = ?
    `).get(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: '房间不存在'
      });
    }

    const members = db.prepare(`
      SELECT u.id, u.nickname, u.avatar, rm.role
      FROM room_members rm
      JOIN users u ON rm.user_id = u.id
      WHERE rm.room_id = ?
    `).all(id);
    room.members = members;

    const messages = db.prepare(`
      SELECT m.*, u.nickname, u.avatar
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ?
      ORDER BY m.created_at DESC
      LIMIT 50
    `).all(id);
    room.messages = messages.reverse();

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: '获取房间详情失败'
    });
  }
});

router.post('/:id/join', (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用户ID'
      });
    }

    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: '房间不存在'
      });
    }

    if (room.current_players >= room.max_players) {
      return res.status(400).json({
        success: false,
        message: '房间已满'
      });
    }

    const existingMember = db.prepare(`
      SELECT * FROM room_members WHERE room_id = ? AND user_id = ?
    `).get(id, userId);

    if (!existingMember) {
      db.prepare(`
        INSERT INTO room_members (room_id, user_id, role)
        VALUES (?, ?, 'player')
      `).run(id, userId);

      db.prepare(`
        UPDATE rooms SET current_players = current_players + 1 WHERE id = ?
      `).run(id);
    }

    res.json({
      success: true,
      message: '加入房间成功'
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      message: '加入房间失败'
    });
  }
});

router.post('/:id/leave', (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用户ID'
      });
    }

    const member = db.prepare(`
      SELECT * FROM room_members WHERE room_id = ? AND user_id = ?
    `).get(id, userId);

    if (member) {
      db.prepare(`
        DELETE FROM room_members WHERE room_id = ? AND user_id = ?
      `).run(id, userId);

      db.prepare(`
        UPDATE rooms SET current_players = current_players - 1 WHERE id = ?
      `).run(id);

      const remainingMembers = db.prepare(`
        SELECT COUNT(*) as count FROM room_members WHERE room_id = ?
      `).get(id);

      if (remainingMembers.count === 0) {
        db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
      }
    }

    res.json({
      success: true,
      message: '离开房间成功'
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({
      success: false,
      message: '离开房间失败'
    });
  }
});

module.exports = router;
