import type { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: '未登录' });
    return;
  }

  try {
    const parts = token.split(':');
    if (parts.length === 2) {
      const [role, id] = parts;
      req.userId = id;
      req.userRole = role;
      next();
      return;
    }
    
    res.status(401).json({ error: 'token无效' });
  } catch {
    res.status(401).json({ error: '认证失败' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: '权限不足' });
      return;
    }
    next();
  };
}
