const jwt = require('jsonwebtoken');
const db = require('../utils/db');

const JWT_SECRET = process.env.JWT_SECRET || 'goal-tracker-secret-key-2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const userRecord = db.prepare('SELECT id, username, role, is_active FROM users WHERE id = ?').get(user.id);
    
    if (!userRecord || !userRecord.is_active) {
      return res.status(403).json({ error: '用户不存在或已被禁用' });
    }
    
    req.user = userRecord;
    next();
  } catch (err) {
    return res.status(403).json({ error: '令牌无效或已过期' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

function logOperation(req, action, targetType, targetId, detail) {
  const stmt = db.prepare(`
    INSERT INTO operation_logs (user_id, action, target_type, target_id, detail, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    req.user ? req.user.id : null,
    action,
    targetType,
    targetId,
    detail ? JSON.stringify(detail) : null,
    req.ip,
    req.headers['user-agent']
  );
}

module.exports = { authenticateToken, requireAdmin, logOperation, JWT_SECRET };
