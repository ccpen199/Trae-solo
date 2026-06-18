import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    username: string;
  };
}

export function authMiddleware(requiredRoles?: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'housekeeping_saas_jwt_secret_2024') as any;
      req.user = {
        id: decoded.id,
        role: decoded.role,
        username: decoded.username,
      };

      if (requiredRoles && !requiredRoles.includes(decoded.role)) {
        return res.status(403).json({ error: '权限不足' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: '认证令牌无效或已过期' });
    }
  };
}
