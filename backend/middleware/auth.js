const jwt = require('jsonwebtoken');
const db = require('../database');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, dbUser) => {
        if (err || !dbUser || dbUser.status !== 1) {
          return res.status(401).json({ code: 401, message: '未提供访问令牌' });
        }
        req.user = dbUser;
        next();
      });
      return;
    }
    return res.status(401).json({ code: 401, message: '未提供访问令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'sichuan_gov_service_secret_key_2024', (err, user) => {
    if (err) {
      return res.status(403).json({ code: 403, message: '无效的访问令牌' });
    }

    db.get('SELECT * FROM users WHERE id = ?', [user.id], (err, dbUser) => {
      if (err || !dbUser) {
        return res.status(401).json({ code: 401, message: '用户不存在' });
      }
      if (dbUser.status !== 1) {
        return res.status(403).json({ code: 403, message: '账号已被禁用' });
      }
      req.user = dbUser;
      next();
    });
  });
}

function normalizeRoles(rows = []) {
  return rows.map((role) => ({
    ...role,
    code: role.code || role.level,
    level: role.level || role.code || 'user'
  }));
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '未登录' });
    }

    db.all('SELECT r.* FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?',
      [req.user.id], (err, userRoles) => {
        if (err) return res.status(500).json({ code: 500, message: '查询角色失败' });

        const roleCodes = normalizeRoles(userRoles).map(r => r.code);
        const hasPermission = roles.some(role => roleCodes.includes(role));

        if (!hasPermission) {
          return res.status(403).json({ code: 403, message: '权限不足' });
        }
        next();
      });
  };
}

function requireLevel(levels) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '未登录' });
    }
    if (!levels.includes(req.user.level) && !levels.includes(req.user.region_level)) {
      return res.status(403).json({ code: 403, message: '区域权限不足' });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole, requireLevel, normalizeRoles };
