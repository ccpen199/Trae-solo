import { Request, Response, NextFunction } from 'express';
import { verifyToken, getClientIp, getRegionByIp } from '../utils';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  username?: string;
  clientIp?: string;
  clientRegion?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未登录或登录已过期' });
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
  }

  req.userId = payload.userId;
  req.userRole = payload.role || 'user';
  req.username = payload.username;
  next();
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const allowedRoles = ['admin', 'operation', 'manager'];
  if (!req.userRole || !allowedRoles.includes(req.userRole)) {
    return res.status(403).json({ success: false, message: '无管理员权限，请联系运营开通' });
  }
  next();
}

export function clientInfoMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  req.clientIp = getClientIp(req);
  req.clientRegion = getRegionByIp(req.clientIp);
  next();
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
