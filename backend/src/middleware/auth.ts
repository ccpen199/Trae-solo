import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';

export interface AuthRequest extends Request {
  user?: any;
  appInfo?: any;
}

const JWT_SECRET = process.env.JWT_SECRET || 'express-open-platform-secret-key-2026';

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: '未登录' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT id, username, role, name, phone, avatar FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(401).json({ code: 'UNAUTHORIZED', message: '用户不存在' });
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: '登录已过期' });
  }
}

export function openApiAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const appKey = req.headers['x-app-key'] as string;
  const appSign = req.headers['x-app-sign'] as string;
  if (!appKey) {
    return authMiddleware(req, res, next);
  }
  const app = db.prepare('SELECT * FROM api_applications WHERE app_key = ? AND status = ?').get(appKey, 'active') as any;
  if (!app) return res.status(401).json({ code: 'INVALID_APP_KEY', message: '无效的AppKey' });

  const today = new Date().toISOString().slice(0, 10);
  if (app.last_reset_date !== today) {
    db.prepare('UPDATE api_applications SET last_reset_date = ?, today_calls = 0 WHERE id = ?').run(today, app.id);
    app.today_calls = 0;
  }
  if (app.today_calls >= app.daily_limit) {
    return res.status(429).json({ code: 'RATE_LIMITED', message: '今日调用次数已达上限' });
  }

  db.prepare('UPDATE api_applications SET total_calls = total_calls + 1, today_calls = today_calls + 1 WHERE id = ?').run(app.id);
  db.prepare('INSERT INTO api_call_logs (app_id, api_path, method, request_params, response_status, ip) VALUES (?, ?, ?, ?, ?, ?)')
    .run(app.id, req.path, req.method, JSON.stringify({ query: req.query, body: req.body }), 200, req.ip);

  req.appInfo = app;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: '权限不足' });
    }
    next();
  };
}
