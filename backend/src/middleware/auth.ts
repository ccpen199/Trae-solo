import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
  requestId: string;
}

export function generateRequestId(req: Request, res: Response, next: NextFunction) {
  (req as AuthRequest).requestId = uuidv4();
  next();
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '未提供认证令牌',
      requestId: (req as AuthRequest).requestId,
      timestamp: new Date().toISOString()
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'js_hrss_jwt_secret_2024') as any;
    
    const db = getDb();
    const tokenRecord = db.prepare(`
      SELECT * FROM auth_tokens 
      WHERE token = ? AND revoked = 0 AND expires_at > ?
    `).get(token, new Date().toISOString());

    if (!tokenRecord) {
      return res.status(401).json({
        code: 401,
        message: '认证令牌已失效或已撤销',
        requestId: (req as AuthRequest).requestId,
        timestamp: new Date().toISOString()
      });
    }

    (req as AuthRequest).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({
      code: 403,
      message: '认证令牌无效',
      requestId: (req as AuthRequest).requestId,
      timestamp: new Date().toISOString()
    });
  }
}

export function governmentAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const governmentToken = req.headers['x-government-auth'];
  
  if (!governmentToken) {
    return res.status(401).json({
      code: 401,
      message: '缺少政务中台认证标识',
      requestId: (req as AuthRequest).requestId,
      timestamp: new Date().toISOString()
    });
  }

  if (governmentToken !== 'JS_GOV_MIDDLEWARE_2024') {
    return res.status(403).json({
      code: 403,
      message: '政务中台认证失败',
      requestId: (req as AuthRequest).requestId,
      timestamp: new Date().toISOString()
    });
  }

  next();
}

export function apiGatewayLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = (req as AuthRequest).requestId;

  console.log(`[API Gateway] ${requestId} ${req.method} ${req.path} - ${req.ip}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API Gateway] ${requestId} ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
}

export function corsHandler(req: Request, res: Response, next: NextFunction) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-government-auth');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
}
