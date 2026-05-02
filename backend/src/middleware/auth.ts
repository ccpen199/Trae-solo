import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../utils/prisma';
import securityVault from '../engines/security-vault';

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  department?: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authMiddleware = (
  requiredRoles?: string[]
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          error: '未提供认证令牌' 
        });
      }

      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ 
          success: false, 
          error: '用户不存在或已被禁用' 
        });
      }

      if (requiredRoles && !requiredRoles.includes(user.role)) {
        await securityVault.recordAuditLog({
          userId: payload.userId,
          action: 'VIEW',
          module: 'SECURITY',
          targetType: 'AccessControl',
          status: 'WARNING',
          errorMessage: `权限不足: 需要 ${requiredRoles.join(',')}，实际 ${user.role}`,
        });

        return res.status(403).json({ 
          success: false, 
          error: '权限不足' 
        });
      }

      req.user = {
        userId: user.id,
        username: user.username,
        role: user.role,
        department: user.department || undefined,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ 
          success: false, 
          error: '令牌已过期' 
        });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ 
          success: false, 
          error: '无效的令牌' 
        });
      }
      return res.status(500).json({ 
        success: false, 
        error: '认证失败' 
      });
    }
  };
};

export const generateToken = (user: { id: string; username: string; role: string; department?: string }): string => {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    department: user.department,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};
