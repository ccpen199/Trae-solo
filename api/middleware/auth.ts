import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    language: string;
    timezone: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : (req.cookies?.token as string);

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as {
      id: number;
      email: string;
      role: string;
    };

    const user = db.prepare(`
      SELECT id, email, full_name, role, language, timezone, is_active
      FROM users 
      WHERE id = ?
    `).get(decoded.id) as any;

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, error: 'User not found or inactive' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      language: user.language,
      timezone: user.timezone,
    };

    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function authenticateTokenOrDemo(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.cookies?.token as string);

  if (token || req.method !== 'GET') {
    return authenticateToken(req, res, next);
  }

  const user = db.prepare(`
    SELECT id, email, full_name, role, language, timezone, is_active
    FROM users
    WHERE role = 'admin' AND is_active = 1
    ORDER BY id
    LIMIT 1
  `).get() as any;

  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    language: user.language,
    timezone: user.timezone,
  };

  next();
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}

export function generateToken(user: { id: number; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '7d' }
  );
}

export default authenticateToken;
