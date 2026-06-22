import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { isDbConnected } from '../config/database';
import { findMockUserById } from '../utils/mockData';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: string;
  };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未授权，请先登录'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as jwt.JwtPayload;
    const uid = decoded.id;

    let user: any = null;

    // 1. 优先查真实DB
    if (isDbConnected()) {
      try {
        user = await User.findById(uid).select('-password');
      } catch (_) { /* DB查询失败，fallback到mock */ }
    }

    // 2. DB不可用或未找到，查mock用户
    if (!user) {
      user = findMockUserById(String(uid));
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    req.user = {
      _id: String(user._id),
      role: user.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token无效或已过期'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未授权'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `角色 ${req.user.role} 无权访问此资源`
      });
    }

    next();
  };
};

export const authorizeDesigner = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  if (req.user.role !== 'designer') {
    return res.status(403).json({
      success: false,
      message: '仅设计师可执行此操作'
    });
  }

  next();
};
