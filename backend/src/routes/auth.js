const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

module.exports = (db) => {
  // 登录
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, error: '用户名和密码为必填项' });
      }

      const user = db.prepare(`
        SELECT id, username, password, name, role, email 
        FROM users WHERE username = ?
      `).get(username);

      if (!user) {
        return res.status(401).json({ success: false, error: '用户名或密码错误' });
      }

      const passwordMatch = bcrypt.compareSync(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, error: '用户名或密码错误' });
      }

      // 简单认证，返回用户信息（实际应该使用JWT）
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          token: user.id // 简化，实际应该用JWT
        }
      });
    } catch (error) {
      console.error('登录错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 获取当前用户信息
  router.get('/me', (req, res) => {
    try {
      // 简化认证：从header获取用户ID
      const userId = req.headers['x-user-id'] || req.query.userId;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: '未登录' });
      }

      const user = db.prepare(`
        SELECT id, username, name, role, email, created_at 
        FROM users WHERE id = ?
      `).get(userId);

      if (!user) {
        return res.status(401).json({ success: false, error: '用户不存在' });
      }

      res.json({ success: true, data: user });
    } catch (error) {
      console.error('获取用户信息错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 获取所有用户（用于选择责任人）
  router.get('/users', (req, res) => {
    try {
      const { role } = req.query;
      
      let query = 'SELECT id, username, name, role, email FROM users WHERE 1=1';
      const params = [];
      
      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }
      
      query += ' ORDER BY name';
      
      const users = db.prepare(query).all(...params);
      
      res.json({ success: true, data: users });
    } catch (error) {
      console.error('获取用户列表错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
