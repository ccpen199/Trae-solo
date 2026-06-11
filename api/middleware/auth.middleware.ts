import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'may-89096-jwt-secret';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌',
    });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      phone: '',
      name: '',
      avatar: null,
      role: decoded.role,
      status: 'active',
      createdAt: '',
      updatedAt: '',
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '认证令牌无效或已过期',
    });
  }
}

export function generateToken(user: { id: number; email: string; role: UserRole }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role } as JwtPayload,
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export default authMiddleware;
