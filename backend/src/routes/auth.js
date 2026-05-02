const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'recycle-platform-secret-key-2024';

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, phone, role, address, latitude, longitude } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: '用户名、密码和角色为必填项' });
    }

    const validRoles = ['resident', 'rider', 'center', 'operator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: '无效的角色类型' });
    }

    db.get('SELECT id FROM users WHERE username = ?', [username], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({ success: false, message: '数据库错误', error: err.message });
      }

      if (existingUser) {
        return res.status(400).json({ success: false, message: '用户名已存在' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `INSERT INTO users (id, username, password, name, phone, role, address, latitude, longitude)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, username, hashedPassword, name, phone, role, address, latitude || null, longitude || null],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ success: false, message: '创建用户失败', error: err.message });
            }

            if (role === 'rider') {
              const riderId = uuidv4();
              db.run(
                `INSERT INTO riders (id, user_id, status) VALUES (?, ?, 'offline')`,
                [riderId, userId],
                (riderErr) => {
                  if (riderErr) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ success: false, message: '创建骑手档案失败', error: riderErr.message });
                  }

                  db.run('COMMIT', (commitErr) => {
                    if (commitErr) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ success: false, message: '事务提交失败', error: commitErr.message });
                    }

                    const token = jwt.sign(
                      { id: userId, username, role },
                      JWT_SECRET,
                      { expiresIn: '7d' }
                    );

                    res.json({
                      success: true,
                      message: '注册成功',
                      data: {
                        user: { id: userId, username, name, phone, role },
                        token
                      }
                    });
                  });
                }
              );
            } else {
              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ success: false, message: '事务提交失败', error: commitErr.message });
                }

                const token = jwt.sign(
                  { id: userId, username, role },
                  JWT_SECRET,
                  { expiresIn: '7d' }
                );

                res.json({
                  success: true,
                  message: '注册成功',
                  data: {
                    user: { id: userId, username, name, phone, role },
                    token
                  }
                });
              });
            }
          }
        );
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码为必填项' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, message: '数据库错误', error: err.message });
      }

      if (!user) {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            phone: user.phone,
            role: user.role,
            address: user.address,
            latitude: user.latitude,
            longitude: user.longitude,
            green_credit: user.green_credit,
            carbon_reduction: user.carbon_reduction
          },
          token
        }
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  db.get(
    'SELECT id, username, name, phone, role, address, latitude, longitude, green_credit, carbon_reduction, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, message: '数据库错误', error: err.message });
      }

      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      res.json({ success: true, data: user });
    }
  );
});

module.exports = router;
