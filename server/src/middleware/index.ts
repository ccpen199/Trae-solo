import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { UserRole } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    username: string;
  };
  traceId: string;
}

export function authMiddleware(requiredRoles?: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or invalid authentication token'
      });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const validation = await authService.validateToken(token);
      
      if (!validation.valid || !validation.user) {
        return res.status(401).json({
          success: false,
          error: validation.error || 'Unauthorized: Invalid token'
        });
      }
      
      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(validation.user.role)) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: Insufficient permissions'
          });
        }
      }
      
      req.user = {
        id: validation.user.id,
        role: validation.user.role,
        username: validation.user.username
      };
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Token validation failed'
      });
    }
  };
}

export function traceMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  req.traceId = req.headers['x-trace-id'] as string || uuidv4();
  res.setHeader('X-Trace-Id', req.traceId);
  next();
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
}

export function rateLimitMiddleware(
  maxRequests: number = 100,
  windowMs: number = 60000
) {
  const requestCounts = new Map<string, { count: number; windowStart: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientKey = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    let clientData = requestCounts.get(clientKey);
    
    if (!clientData) {
      clientData = { count: 1, windowStart: now };
      requestCounts.set(clientKey, clientData);
    } else if (now - clientData.windowStart > windowMs) {
      clientData.count = 1;
      clientData.windowStart = now;
    } else {
      clientData.count++;
    }
    
    if (clientData.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later'
      });
      return;
    }
    
    next();
  };
}
