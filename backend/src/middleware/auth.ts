import { Request, Response, NextFunction } from 'express';
import { createHash, randomBytes } from 'crypto';
import db from '../database/index.js';
import { v4 as uuidv4 } from 'uuid';
import { auditService } from '../services/audit-service.js';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: 'user' | 'admin' | 'collaborator' | 'compliance';
  status: string;
  storageQuota: number;
  storageUsed: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

function getClientIp(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}

export function mapRowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    username: row.username as string,
    displayName: (row.display_name as string) || (row.username as string),
    email: row.email as string | null,
    role: row.role as 'user' | 'admin' | 'collaborator' | 'compliance',
    status: row.status as string,
    storageQuota: row.storage_quota as number,
    storageUsed: row.storage_used as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    lastLoginAt: row.last_login_at as string | null
  };
}

export function getUserById(userId: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const result = stmt.get(userId);
  if (!result) return null;
  return mapRowToUser(result as Record<string, unknown>);
}

export function getUserByUsername(username: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const result = stmt.get(username);
  if (!result) return null;
  return mapRowToUser(result as Record<string, unknown>);
}

export function validateSession(token: string): { user: User; session: AuthSession } | null {
  const stmt = db.prepare(`
    SELECT s.*, u.* 
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `);
  const result = stmt.get(token);
  
  if (!result) return null;
  
  const row = result as Record<string, unknown>;
  return {
    user: mapRowToUser(row),
    session: {
      id: row.id as string,
      userId: row.user_id as string,
      token: row.token as string,
      createdAt: row.created_at as string,
      expiresAt: row.expires_at as string,
      ipAddress: row.ip_address as string | null,
      userAgent: row.user_agent as string | null
    }
  };
}

export function createSession(userId: string, req: Request): AuthSession {
  const token = generateToken();
  const sessionId = uuidv4();
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);
  
  const insertStmt = db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insertStmt.run(sessionId, userId, token, expiresAt.toISOString(), ipAddress, userAgent);
  
  db.prepare(`
    UPDATE users 
    SET last_login_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(userId);
  
  return {
    id: sessionId,
    userId,
    token,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    ipAddress,
    userAgent
  };
}

export function login(username: string, password: string, req: Request): { user: User; session: AuthSession } | null {
  const passwordHash = hashPassword(password);
  const user = getUserByUsername(username);
  
  if (!user) {
    return null;
  }
  
  const verifyStmt = db.prepare(
    'SELECT id FROM users WHERE username = ? AND password_hash = ?'
  );
  const verifyResult = verifyStmt.get(username, passwordHash);
  
  if (!verifyResult) {
    auditService.logUserLogin(user.id, username, {
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      success: false,
      failReason: '密码错误'
    });
    return null;
  }
  
  const session = createSession(user.id, req);
  
  auditService.logUserLogin(user.id, username, {
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    success: true
  });
  
  return { user, session };
}

export function logout(token: string): boolean {
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  const result = stmt.run(token);
  return result.changes > 0;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未授权访问，请先登录' });
    return;
  }
  
  const token = authHeader.substring(7);
  const result = validateSession(token);
  
  if (!result) {
    res.status(401).json({ error: 'Token 无效或已过期' });
    return;
  }
  
  req.user = result.user;
  req.token = token;
  next();
}

export function adminMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: '需要管理员权限' });
    return;
  }
  
  next();
}

export function complianceMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'compliance') {
    res.status(403).json({ error: '需要合规管理员权限' });
    return;
  }
  
  next();
}

export function getRequestInfo(req: Request): { ip: string; userAgent: string } {
  return {
    ip: getClientIp(req),
    userAgent: getUserAgent(req)
  };
}
