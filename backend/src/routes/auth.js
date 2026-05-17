const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3个字符'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { username, password, email } = req.body;

    db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '数据库错误'
        });
      }

      if (row) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
      const nickname = username;

      db.run(
        'INSERT INTO users (username, email, password, avatar, nickname) VALUES (?, ?, ?, ?, ?)',
        [username, email || null, hashedPassword, avatar, nickname],
        function (err) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: '注册失败'
            });
          }

          const token = jwt.sign(
            { id: this.lastID, username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.json({
            success: true,
            message: '注册成功',
            data: {
              token,
              user: {
                id: this.lastID,
                username,
                avatar,
                nickname,
                is_vip: 0
              }
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/login', [
  body('username').notEmpty().withMessage('请输入用户名'),
  body('password').notEmpty().withMessage('请输入密码')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '数据库错误'
        });
      }

      if (!user) {
        return res.status(400).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            nickname: user.nickname,
            is_vip: user.is_vip,
            bio: user.bio
          }
        }
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, avatar, nickname, bio, is_vip, vip_expire_at, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '获取用户信息失败'
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        data: user
      });
    }
  );
});

module.exports = router;
