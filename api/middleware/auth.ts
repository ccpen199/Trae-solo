import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({
      code: 401,
      message: '未授权访问',
      data: null,
      timestamp: Date.now(),
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'freight-platform-secret-key-2024') as {
      id: string;
      username: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      code: 401,
      message: 'Token 无效或已过期',
      data: null,
      timestamp: Date.now(),
    });
  }
}
