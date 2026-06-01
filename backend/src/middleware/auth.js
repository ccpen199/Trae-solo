const db = require('../models/database');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const session = await db.get(
      'SELECT s.*, u.role_id, r.name as role_name, r.permissions FROM sessions s ' +
      'JOIN users u ON s.user_id = u.id ' +
      'JOIN roles r ON u.role_id = r.id ' +
      'WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP',
      [token]
    );

    if (!session) {
      return res.status(401).json({ error: '无效或过期的认证令牌' });
    }

    req.user = {
      id: session.user_id,
      roleId: session.role_id,
      roleName: session.role_name,
      permissions: JSON.parse(session.permissions)
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: '认证服务错误' });
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user?.permissions?.includes(permission)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

module.exports = { authMiddleware, requirePermission };
