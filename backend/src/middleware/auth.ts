import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, rowToUser, rowToSession } from '../db.js';
import { User, Session } from '../types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vuln-scan-secret-key-2024';

export interface AuthRequest extends Request {
  user?: User;
  session?: Session;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; sessionId: number };

    const sessionRow = db.prepare('SELECT * FROM sessions WHERE id = ?').get(decoded.sessionId) as any;
    if (!sessionRow) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }

    const session = rowToSession(sessionRow);
    if (!session || new Date(session.expiresAt) < new Date()) {
      res.status(401).json({ error: 'Session expired' });
      return;
    }

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(session.userId) as any;
    if (!userRow) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const user = rowToUser(userRow);
    if (!user || user.status !== 'active') {
      res.status(401).json({ error: 'User account disabled' });
      return;
    }

    req.user = user;
    req.session = session;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function adminRequired(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const adminRoles = ['platform_engineer', 'security_admin'];
  if (!adminRoles.includes(req.user.role)) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

export function generateToken(userId: number, sessionId: number): string {
  return jwt.sign({ userId, sessionId }, JWT_SECRET, { expiresIn: '24h' });
}
