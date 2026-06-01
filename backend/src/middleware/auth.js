import jwt from 'jsonwebtoken';
import db from '../database/init.js';

const JWT_SECRET = 'db-backup-platform-secret-key-2024';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, real_name, role, status FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: '用户不存在或已被禁用' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: '认证令牌无效' });
  }
};

export const checkPermission = (resource, action) => {
  return (req, res, next) => {
    const { role } = req.user;
    
    const permission = db.prepare(`
      SELECT allowed FROM permission_matrix 
      WHERE role = ? AND resource = ? AND action = ?
    `).get(role, resource, action);

    db.prepare(`
      INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, permission_granted, description, ip_address)
      VALUES ('permission_check', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      req.user.username,
      action,
      resource,
      permission?.allowed ? 1 : 0,
      `权限检查: ${role} - ${resource} - ${action}`,
      req.ip
    );

    if (!permission || !permission.allowed) {
      db.prepare(`
        INSERT INTO alerts (alert_no, alert_type, severity, title, content, status)
        VALUES (?, 'permission_violation', 'warning', ?, ?, 'active')
      `).run(
        `ALT-${Date.now()}`,
        `权限越权尝试: ${req.user.username}`,
        `用户 ${req.user.username}(${role}) 尝试访问 ${resource} - ${action}，权限不足`
      );
      return res.status(403).json({ error: '权限不足，该操作已记录审计日志' });
    }

    next();
  };
};

export const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export default { authenticate, checkPermission, generateToken };
