const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.post('/', (req, res) => {
  try {
    const { userId, type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        message: '缺少必填参数'
      });
    }

    db.prepare(`
      DELETE FROM matches WHERE user_id = ? AND status = 'matching'
    `).run(userId);

    db.prepare(`
      INSERT INTO matches (user_id, type, status)
      VALUES (?, ?, 'matching')
    `).run(userId, type);

    const availableRooms = db.prepare(`
      SELECT id FROM rooms 
      WHERE type = ? AND status = 'waiting' AND current_players < max_players
      ORDER BY popularity DESC, current_players DESC
      LIMIT 1
    `).all(type);

    if (availableRooms.length > 0) {
      const room = availableRooms[0];
      db.prepare(`
        UPDATE matches SET status = 'matched', matched_room_id = ? WHERE user_id = ?
      `).run(room.id, userId);

      return res.json({
        success: true,
        data: {
          matched: true,
          roomId: room.id
        }
      });
    }

    res.json({
      success: true,
      data: {
        matched: false,
        message: '正在匹配中...'
      }
    });
  } catch (error) {
    console.error('Start match error:', error);
    res.status(500).json({
      success: false,
      message: '开始匹配失败'
    });
  }
});

router.delete('/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    db.prepare(`
      DELETE FROM matches WHERE user_id = ? AND status = 'matching'
    `).run(userId);

    res.json({
      success: true,
      message: '取消匹配成功'
    });
  } catch (error) {
    console.error('Cancel match error:', error);
    res.status(500).json({
      success: false,
      message: '取消匹配失败'
    });
  }
});

router.get('/:userId/status', (req, res) => {
  try {
    const { userId } = req.params;

    const match = db.prepare(`
      SELECT * FROM matches 
      WHERE user_id = ? AND status = 'matching'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId);

    if (match) {
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - match.created_at;

      res.json({
        success: true,
        data: {
          matching: true,
          elapsed,
          type: match.type
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          matching: false
        }
      });
    }
  } catch (error) {
    console.error('Get match status error:', error);
    res.status(500).json({
      success: false,
      message: '获取匹配状态失败'
    });
  }
});

module.exports = router;
