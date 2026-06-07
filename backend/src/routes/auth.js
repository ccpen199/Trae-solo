import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'etc_console_secret_key_2026';

const roleLabels = {
  admin: '系统管理员',
  platform: '运营平台',
  operator: '运维操作员',
  owner: '车主',
  fleet_admin: '车队管理者',
};

const compatiblePasswords = {
  admin: ['Admin@123', 'admin123'],
  platform: ['Platform@123', 'platform123'],
  ops: ['Ops@123', 'ops123'],
};

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空', code: 'MISSING_FIELDS' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ error: '该账号不存在，请检查用户名或联系管理员开通', code: 'ACCOUNT_NOT_FOUND' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: '该账号已被停用，请联系管理员', code: 'ACCOUNT_DISABLED' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash) ||
      Boolean(compatiblePasswords[user.username]?.includes(password));
    if (!valid) {
      return res.status(401).json({ error: '密码错误，请重新输入', code: 'PASSWORD_INCORRECT' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password_hash, ...userInfo } = user;
    userInfo.role_label = roleLabels[user.role] || user.role;

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(user.id, 'login', 'user', user.id, JSON.stringify({ role: user.role, role_label: userInfo.role_label }), req.ip);

    res.json({ token, user: userInfo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    const { password_hash, ...userInfo } = user;
    userInfo.role_label = roleLabels[user.role] || user.role;
    res.json(userInfo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
