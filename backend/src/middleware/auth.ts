import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: string;
      };
    }
  }
}

export function auth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  const token = header.slice(7);
  try {
    const secret = process.env.JWT_SECRET || 'default_secret';
    const decoded = jwt.verify(token, secret) as { id: number; username: string; role: string };
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const secret = process.env.JWT_SECRET || 'default_secret';
      const decoded = jwt.verify(token, secret) as { id: number; username: string; role: string };
      req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    } catch {}
  }
  next();
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  auth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}

export function creatorAuth(req: Request, res: Response, next: NextFunction): void {
  auth(req, res, () => {
    if (req.user?.role !== 'creator' && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Creator access required' });
      return;
    }
    next();
  });
}
