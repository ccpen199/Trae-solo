import { Request, Response, NextFunction } from 'express';
import { ApiResponse, AuthenticatedRequest, JWTPayload } from '../types';
import { verifyToken } from '../utils/auth';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌',
      error: 'AUTH_TOKEN_MISSING',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }

  const token = authHeader.replace('Bearer ', '');
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      message: '令牌无效或已过期',
      error: 'AUTH_TOKEN_INVALID',
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  }

  (req as AuthenticatedRequest).user = payload;
  next();
}

export function roleMiddleware(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        error: 'USER_NOT_AUTHENTICATED',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
        error: 'INSUFFICIENT_PERMISSIONS',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }

    next();
  };
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (payload) {
      (req as AuthenticatedRequest).user = payload;
    }
  }

  next();
}
