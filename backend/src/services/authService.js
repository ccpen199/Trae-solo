const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'bus-scheduler-secret-key-2024';

class AuthService {
  constructor(db) {
    this.db = db;
  }

  login(username, password) {
    const user = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      throw new Error('用户不存在');
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new Error('密码错误');
    }

    if (user.status !== 'active') {
      throw new Error('用户已被禁用');
    }

    const token = jwt.sign(
      { 
        userId: user.user_id, 
        username: user.username,
        name: user.name,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }

  hasPermission(userRole, permission) {
    const role = this.db.prepare('SELECT * FROM roles WHERE role_code = ?').get(userRole);
    
    if (!role) return false;

    const permissions = role.permissions.split(',');
    return permissions.includes(permission);
  }

  getRolePermissions(userRole) {
    const role = this.db.prepare('SELECT * FROM roles WHERE role_code = ?').get(userRole);
    
    if (!role) return [];

    return role.permissions.split(',');
  }

  middleware(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);
    const decoded = this.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: '令牌无效或已过期' });
    }

    req.user = decoded;
    next();
  }

  permissionMiddleware(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: '未登录' });
      }

      if (!this.hasPermission(req.user.role, permission)) {
        return res.status(403).json({ error: '无权限执行此操作' });
      }

      next();
    };
  }
}

module.exports = AuthService;
