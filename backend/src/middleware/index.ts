import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未提供认证令牌',
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: '无效的认证令牌',
    });
  }
}

export function roleMiddleware(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '需要登录',
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email} with role ${req.user.role}. Allowed roles: ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        error: '权限不足',
        allowedRoles,
        userRole: req.user.role,
      });
    }
    
    next();
  };
}

export function auditMiddleware(action: string, entityType?: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.send.bind(res);
    
    res.send = function(body: unknown): Response {
      const responseTime = Date.now() - startTime;
      
      try {
        let entityId: string | undefined = req.params.id;
        if (!entityId && req.body && typeof req.body === 'object') {
          entityId = (req.body as Record<string, unknown>).id as string;
        }
        
        let success = false;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          success = true;
        }
        
        if (req.user) {
          prisma.auditLog.create({
            data: {
              action,
              entityType: entityType || 'unknown',
              entityId,
              userId: req.user.id,
              userEmail: req.user.email,
              ipAddress: req.ip || req.socket.remoteAddress,
              userAgent: req.headers['user-agent'],
              details: success ? `${action} successful (${responseTime}ms)` : `${action} failed with status ${res.statusCode}`,
              metadata: {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                responseTime,
                query: req.query,
              } as unknown as Record<string, unknown>,
            },
          }).catch((err) => {
            logger.error('Failed to create audit log:', err);
          });
        }
      } catch (err) {
        logger.error('Audit middleware error:', err);
      }
      
      return originalSend(body);
    };
    
    next();
  };
}

export function rateLimitMiddleware() {
  const requestCounts = new Map<string, { count: number; windowStart: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientKey = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = config.rateLimit.windowMs;
    const maxRequests = config.rateLimit.maxRequests;
    
    const clientData = requestCounts.get(clientKey);
    
    if (!clientData || now - clientData.windowStart > windowMs) {
      requestCounts.set(clientKey, { count: 1, windowStart: now });
      return next();
    }
    
    clientData.count++;
    
    if (clientData.count > maxRequests) {
      logger.warn(`Rate limit exceeded for ${clientKey}: ${clientData.count} requests`);
      return res.status(429).json({
        success: false,
        error: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil((windowMs - (now - clientData.windowStart)) / 1000),
      });
    }
    
    next();
  };
}

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error('Request error:', {
    method: req.method,
    path: req.path,
    error: error.message,
    stack: error.stack,
  });
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: '验证失败',
      details: error.message,
    });
  }
  
  if (error.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      error: '资源未找到',
    });
  }
  
  return res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}
