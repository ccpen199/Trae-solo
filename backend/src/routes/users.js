const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const router = express.Router();

router.post('/login', (req, res) => {
  const { nickname, userId } = req.body;
  
  if (!nickname) {
    return res.status(400).json({ error: '昵称不能为空' });
  }

  if (userId) {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
      const user = stmt.get(userId);
      
      if (user) {
        if (user.nickname !== nickname) {
          const updateStmt = db.prepare('UPDATE users SET nickname = ? WHERE id = ?');
          updateStmt.run(nickname, userId);
        }
        
        return res.json({
          success: true,
          user: {
            id: user.id,
            nickname: nickname || user.nickname,
            avatar: user.avatar
          }
        });
      } else {
        const newUserId = uuidv4();
        const insertStmt = db.prepare('INSERT INTO users (id, nickname) VALUES (?, ?)');
        insertStmt.run(newUserId, nickname);
        
        res.json({
          success: true,
          user: {
            id: newUserId,
            nickname,
            avatar: 'default'
          }
        });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: '操作失败' });
    }
  } else {
    try {
      const newUserId = uuidv4();
      const insertStmt = db.prepare('INSERT INTO users (id, nickname) VALUES (?, ?)');
      insertStmt.run(newUserId, nickname);
      
      res.json({
        success: true,
        user: {
          id: newUserId,
          nickname,
          avatar: 'default'
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: '创建用户失败' });
    }
  }
});

router.post('/info', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: '缺少用户ID' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '查询用户失败' });
  }
});

module.exports = router;