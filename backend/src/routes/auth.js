const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function createAuthRouter(db) {
  const router = express.Router();

  router.post('/login', (req, res) => {
    try {
      const { username, password } = req.body;

      const user = db.prepare(`
        SELECT u.*, r.name as role_name, r.description as role_description
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.username = ?
      `).get(username);

      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ error: '账户已被禁用' });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role_name },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      db.prepare(`
        INSERT INTO operation_logs (user_id, action, resource, ip_address)
        VALUES (?, 'login', 'auth', ?)
      `).run(user.id, req.ip);

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          real_name: user.real_name,
          role_name: user.role_name,
          role_description: user.role_description,
          email: user.email
        }
      });
    } catch (error) {
      res.status(500).json({ error: '登录失败: ' + error.message });
    }
  });

  router.get('/current', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = db.prepare(`
        SELECT u.id, u.username, u.real_name, r.name as role_name, r.description as role_description, u.email
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `).get(decoded.userId);

      if (!user) {
        return res.status(401).json({ error: '用户不存在' });
      }

      res.json({ user });
    } catch (error) {
      res.status(401).json({ error: '令牌已过期' });
    }
  });

  return router;
}

module.exports = createAuthRouter;
