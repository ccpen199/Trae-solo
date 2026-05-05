import jwt from 'jsonwebtoken';
import { get } from '../database.js';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '无效的认证令牌' });
  }
};

export const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await get(`
        SELECT u.*, r.name as role_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.id = ?
      `, [req.userId]);

      if (!user) {
        return res.status(401).json({ success: false, message: '用户不存在' });
      }

      if (!roles.includes(user.role_name)) {
        return res.status(403).json({ success: false, message: '权限不足' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('权限检查错误:', error);
      return res.status(500).json({ success: false, message: '权限检查失败' });
    }
  };
};
