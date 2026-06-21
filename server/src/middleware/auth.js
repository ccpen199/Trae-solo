const { verifyToken } = require('../utils/common');
const db = require('../config/database');

function authMiddleware(requiredRoles = []) {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ code: 401, message: '未提供认证令牌' });
      }

      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      
      if (!payload) {
        return res.status(401).json({ code: 401, message: '令牌无效或已过期' });
      }

      const user = db.prepare('SELECT id, username, role, status, parent_id FROM users WHERE id = ?').get(payload.userId);
      if (!user) {
        return res.status(401).json({ code: 401, message: '用户不存在' });
      }

      if (user.status !== 1) {
        return res.status(403).json({ code: 403, message: '账号已被禁用' });
      }

      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        return res.status(403).json({ code: 403, message: '权限不足' });
      }

      req.user = user;
      req.tokenPayload = payload;
      next();
    } catch (e) {
      console.error('Auth middleware error:', e);
      res.status(500).json({ code: 500, message: '认证服务异常' });
    }
  };
}

function temporaryAuthMiddleware() {
  return (req, res, next) => {
    const tempToken = req.headers['x-temp-token'] || req.query.temp_token;
    if (!tempToken) {
      return next();
    }

    const share = db.prepare(`
      SELECT ds.*, d.name as device_name, d.owner_id
      FROM device_shares ds 
      JOIN devices d ON ds.device_id = d.id
      WHERE ds.temporary_token = ? AND ds.status = 1
    `).get(tempToken);

    if (share && (!share.temporary_token_expire || new Date(share.temporary_token_expire) > new Date())) {
      req.tempShare = share;
    }
    next();
  };
}

function validateDevicePermission(userId, deviceId, requiredPermission = 'view') {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId);
  if (!device) return { allowed: false, message: '设备不存在' };

  if (device.owner_id === userId) {
    return { allowed: true, permission: 'config', device };
  }

  const share = db.prepare(`
    SELECT * FROM device_shares 
    WHERE device_id = ? AND share_to_user_id = ? AND status = 1
  `).get(deviceId, userId);

  if (!share) {
    return { allowed: false, message: '无设备访问权限' };
  }

  const permissionLevels = { 'view': 1, 'talk': 2, 'config': 3 };
  if (permissionLevels[share.permission_level] < permissionLevels[requiredPermission]) {
    return { allowed: false, message: '权限等级不足' };
  }

  return { allowed: true, permission: share.permission_level, device };
}

function riskControlMiddleware() {
  return async (req, res, next) => {
    try {
      const username = req.body?.username;
      if (!username) return next();

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const failCount = db.prepare(`
        SELECT COUNT(*) as count FROM login_logs 
        WHERE username = ? AND status = 0 AND created_at > ?
      `).get(username, oneHourAgo).count;

      if (failCount >= 5) {
        return res.status(429).json({ 
          code: 429, 
          message: '登录失败次数过多，请1小时后再试',
          needCaptcha: true 
        });
      }

      next();
    } catch (e) {
      next();
    }
  };
}

module.exports = {
  authMiddleware,
  temporaryAuthMiddleware,
  validateDevicePermission,
  riskControlMiddleware
};
