import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { User, ApiResponse } from '../data/mockData.js';

const JWT_SECRET = process.env.JWT_SECRET || 'government-service-platform-secret-key-2024';
const JWT_EXPIRES_IN = '24h';

export interface AuthRequest extends Request {
  user?: User;
}

export const generateToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, userType: user.userType, authLevel: user.authLevel },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: '未提供认证令牌',
    } as ApiResponse);
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({
      success: false,
      message: '认证令牌无效或已过期',
    } as ApiResponse);
    return;
  }

  req.user = {
    id: decoded.id,
    name: '',
    idCard: '',
    phone: '',
    userType: decoded.userType,
    authLevel: decoded.authLevel,
    createdAt: new Date(),
  } as User;

  next();
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || (req.user.userType !== 'admin' && req.user.userType !== 'staff')) {
    res.status(403).json({
      success: false,
      message: '权限不足，需要管理员或工作人员身份',
    } as ApiResponse);
    return;
  }
  next();
};

export const requireAuthLevel = (level: number) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.authLevel < level) {
      res.status(403).json({
        success: false,
        message: `认证等级不足，需要${level}级认证`,
      } as ApiResponse);
      return;
    }
    next();
  };
};
