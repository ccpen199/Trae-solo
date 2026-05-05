import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { error } from '../utils/response';

export interface JwtPayload {
  userId: string;
  username: string;
  roleId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'erp-system-jwt-secret-key-2024';

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json(error('No token provided', 401));
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json(error('Invalid or expired token', 403));
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.user = decoded;
    } catch {
      // Token invalid, but still allow access
    }
  }
  next();
}

export function hasPermission(permissionCode?: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json(error('Unauthorized', 401));
      return;
    }

    if (!permissionCode) {
      next();
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      if (!user) {
        res.status(401).json(error('User not found', 401));
        return;
      }

      if (user.role?.type === 'ADMIN') {
        next();
        return;
      }

      const hasPermission = user.role?.permissions?.some(
        (rp) => rp.permission.code === permissionCode
      );

      if (!hasPermission) {
        res.status(403).json(error('Permission denied', 403));
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
