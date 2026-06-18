import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  citizenId?: string;
  role?: 'citizen' | 'staff' | 'admin';
  tokenPayload?: any;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未提供有效的身份认证凭证',
      requestId: (req as any).requestId
    });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret) as any;
    req.userId = payload.sub || payload.userId;
    req.citizenId = payload.citizenId;
    req.role = payload.role || 'citizen';
    req.tokenPayload = payload;

    if (payload.exp && payload.exp * 1000 < Date.now() + 5 * 60 * 1000) {
      res.setHeader('X-Token-Refresh', 'recommended');
    }

    next();
  } catch (error: any) {
    logger.warn('[Auth] Token验证失败:', {
      error: error.message,
      ip: req.ip
    });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '登录已过期，请重新登录',
        errorCode: 'TOKEN_EXPIRED',
        requestId: (req as any).requestId
      });
    }

    return res.status(401).json({
      code: 401,
      message: '身份认证失败，请重新登录',
      errorCode: 'TOKEN_INVALID',
      requestId: (req as any).requestId
    });
  }
};

export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，无法访问此资源',
        requiredRoles: allowedRoles,
        requestId: (req as any).requestId
      });
    }
    next();
  };
};

export const generateToken = (payload: {
  userId: string;
  citizenId?: string;
  role?: string;
  extra?: Record<string, unknown>;
}) => {
  const tokenPayload = {
    sub: payload.userId,
    citizenId: payload.citizenId,
    role: payload.role || 'citizen',
    iat: Math.floor(Date.now() / 1000),
    ...payload.extra
  };

  const accessToken = jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  });

  const refreshToken = jwt.sign(
    { sub: payload.userId, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};
