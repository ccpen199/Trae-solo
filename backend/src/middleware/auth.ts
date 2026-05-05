import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../types';

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: UserRole;
    departmentId?: number;
  };
}

const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未授权：缺少有效令牌' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      departmentId: decoded.departmentId
    };
    next();
  } catch (error) {
    return res.status(403).json({ message: '令牌无效或已过期' });
  }
};

const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: '无权限访问此资源' });
    }

    next();
  };
};

const authorizeSelfOrAdmin = (paramId: string = 'id') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const targetId = parseInt(req.params[paramId] || req.body.userId);
    const isSelf = req.user.id === targetId;
    const isAdmin = req.user.role === UserRole.ADMIN || req.user.role === UserRole.GM;

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: '无权限访问此资源' });
    }

    next();
  };
};

export { authenticateJWT, authorizeRoles, authorizeSelfOrAdmin, AuthRequest };
