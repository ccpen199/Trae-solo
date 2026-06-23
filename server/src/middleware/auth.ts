import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    communityId: string;
    projectId?: string;
  };
}

export const auth = (requiredRoles?: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      req.user = decoded;
      if (requiredRoles && !requiredRoles.includes(decoded.role)) {
        return res.status(403).json({ message: '权限不足' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ message: '认证令牌无效' });
    }
  };
};
