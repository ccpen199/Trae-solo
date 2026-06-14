import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getDB } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ip-platform-secret-key-2024';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ error: '认证令牌无效' });
  }

  try {
    const db = getDB();
    const user = db.prepare('SELECT id, username, name, role, email, phone, status FROM users WHERE id = ?').get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: '账户已被禁用' });
    }

    const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
    if (!session) {
      return res.status(401).json({ error: '认证令牌已过期' });
    }

    if (Number.isNaN(Date.parse(session.expires_at)) || Date.parse(session.expires_at) <= Date.now()) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return res.status(401).json({ error: '认证令牌已过期' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('Authentication middleware error:', err);
    return res.status(500).json({ error: '认证服务异常' });
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足，需要角色: ' + roles.join(', ') });
    }
    next();
  };
}

export function generateToken(userId) {
  return jwt.sign({ userId, jti: randomUUID() }, JWT_SECRET, { expiresIn: '7d' });
}

export { JWT_SECRET };
