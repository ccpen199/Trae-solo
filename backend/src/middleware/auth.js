import jwt from 'jsonwebtoken';
import { db } from '../database.js';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, username, real_name, verified, balance, level, is_admin FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ error: '登录已过期' });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: '无权限访问' });
  }
  next();
}

export { authMiddleware, adminMiddleware };
