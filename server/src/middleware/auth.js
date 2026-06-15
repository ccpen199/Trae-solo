import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: '未登录' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'huizhou_community_secret_key');
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, error: '用户不存在' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: '登录已过期' });
  }
};

export const adminMiddleware = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ success: false, error: '无管理员权限' });
  }
  next();
};
