import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload, UserRole, ApiResponse } from '@platform/shared';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      traceId: string;
    }
  }
}

export function authMiddleware(requiredRoles?: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未授权：缺少访问令牌',
        timestamp: Date.now(),
        traceId: req.traceId,
      } as ApiResponse);
    }
    try {
      const token = authHeader.slice(7);
      const payload = jwt.verify(token, config.jwt.secret) as JWTPayload;
      req.user = payload;
      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(payload.role)) {
          return res.status(403).json({
            code: 403,
            message: '无权限：角色不匹配',
            timestamp: Date.now(),
            traceId: req.traceId,
          } as ApiResponse);
        }
      }
      next();
    } catch (err) {
      return res.status(401).json({
        code: 401,
        message: '未授权：令牌无效或已过期',
        timestamp: Date.now(),
        traceId: req.traceId,
      } as ApiResponse);
    }
  };
}

export function requireVerifiedApplicant(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '未授权',
      timestamp: Date.now(),
      traceId: req.traceId,
    } as ApiResponse);
  }
  if (req.user.role !== UserRole.APPLICANT) {
    return res.status(403).json({
      code: 403,
      message: '仅限申请人操作',
      timestamp: Date.now(),
      traceId: req.traceId,
    } as ApiResponse);
  }
  if (!req.user.realNameVerified) {
    return res.status(403).json({
      code: 4031,
      message: '请先完成实名认证和人脸核验',
      timestamp: Date.now(),
      traceId: req.traceId,
    } as ApiResponse);
  }
  next();
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwt.secret as string, {
    expiresIn: config.jwt.expiresIn as any,
  });
}
