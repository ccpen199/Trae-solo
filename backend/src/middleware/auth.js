import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: '未登录或登录已过期' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await query(
      'SELECT id, username, real_name, role_id, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }

    const user = userResult.rows[0];
    
    if (user.status !== 1) {
      return res.status(403).json({ success: false, message: '账户已被禁用' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
    }
    return res.status(401).json({ success: false, message: '认证失败' });
  }
};

export const permissionMiddleware = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: '未登录' });
      }

      const roleResult = await query(
        'SELECT permissions FROM roles WHERE id = $1',
        [req.user.role_id]
      );

      if (roleResult.rows.length === 0) {
        return res.status(403).json({ success: false, message: '角色不存在' });
      }

      const permissions = JSON.parse(roleResult.rows[0].permissions || '[]');
      
      if (!permissions.includes('all') && !permissions.includes(requiredPermission)) {
        return res.status(403).json({ success: false, message: '无权限操作' });
      }

      next();
    } catch (err) {
      console.error('权限检查错误:', err);
      return res.status(500).json({ success: false, message: '权限检查失败' });
    }
  };
};

export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const userResult = await query(
        'SELECT id, username, real_name, role_id, status FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length > 0 && userResult.rows[0].status === 1) {
        req.user = userResult.rows[0];
      }
    }
    next();
  } catch (err) {
    next();
  }
};
