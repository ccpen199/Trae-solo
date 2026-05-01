import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌',
    });
  }

  const token = authHeader.split(' ')[1];
  const userId = await authService.validateToken(token);

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '令牌无效或已过期',
    });
  }

  const user = await authService.getUserById(userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '用户不存在',
    });
  }

  req.userId = userId;
  req.userRole = user.role;

  next();
};

export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
      });
    }
    next();
  };
};

export const distributorMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: '请先登录',
    });
  }
  next();
};

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const userId = await authService.validateToken(token);
    if (userId) {
      const user = await authService.getUserById(userId);
      if (user) {
        req.userId = userId;
        req.userRole = user.role;
      }
    }
  }

  next();
};
