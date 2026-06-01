import { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';
import { AuthRequest } from './auth.js';

export function apiLogMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';
  
  let requestBody = '';
  if (req.body && Object.keys(req.body).length > 0) {
    try {
      requestBody = JSON.stringify(req.body);
    } catch {
      requestBody = '[object]';
    }
  }

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const userId = req.user?.id || null;

    try {
      db.prepare(`
        INSERT INTO api_logs (method, path, user_id, status_code, duration, ip, user_agent, request_body)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(method, path, userId, statusCode, duration, ip, userAgent, requestBody);
    } catch (err) {
      console.error('Failed to write API log:', err);
    }
  });

  next();
}
