import { Request, Response, NextFunction } from 'express';
import { jwtService, JwtPayload } from '../services/jwt.service.js';
import { UserRole } from '../types/common.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface AuthOptions {
  roles?: UserRole[];
  allowAny?: boolean;
}

export class AuthMiddleware {
  public authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyAccessToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        message: '令牌无效或已过期',
        code: 'TOKEN_INVALID',
      });
      return;
    }

    req.user = payload;
    next();
  }

  public authorize(options: AuthOptions = {}) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '未登录',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      if (options.allowAny) {
        next();
        return;
      }

      const userRole = req.user.roleCode as UserRole;

      if (userRole === UserRole.SUPER_ADMIN) {
        next();
        return;
      }

      if (options.roles && !options.roles.includes(userRole)) {
        res.status(403).json({
          success: false,
          message: '权限不足',
          code: 'FORBIDDEN',
        });
        return;
      }

      next();
    };
  }

  public optionalAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = jwtService.verifyAccessToken(token);
      if (payload) {
        req.user = payload;
      }
    }

    next();
  }
}

export const authMiddleware = new AuthMiddleware();
