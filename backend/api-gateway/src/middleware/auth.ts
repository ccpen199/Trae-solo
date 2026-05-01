import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload, UserRole, ApiResponse } from '../types';
import { logger } from '../utils/logger';

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'AUTH_TOKEN_MISSING',
        message: 'Authentication token is required',
      },
      timestamp: new Date().toISOString(),
      requestId: req.context.requestId,
    };
    return res.status(401).json(response);
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    req.context.userId = decoded.userId;
    req.context.userRole = decoded.role;

    logger.debug('User authenticated', {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    });

    next();
  } catch (error) {
    logger.warn('Invalid token', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid or expired authentication token',
      },
      timestamp: new Date().toISOString(),
      requestId: req.context.requestId,
    };
    return res.status(401).json(response);
  }
};

export const checkRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
        requestId: req.context.requestId,
      };
      return res.status(401).json(response);
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Access denied - insufficient permissions', {
        userId: req.user.userId,
        userRole: req.user.role,
        allowedRoles,
        path: req.path,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Insufficient permissions to access this resource',
          details: {
            userRole: req.user.role,
            requiredRoles: allowedRoles,
          },
        },
        timestamp: new Date().toISOString(),
        requestId: req.context.requestId,
      };
      return res.status(403).json(response);
    }

    next();
  };
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = decoded;
      req.context.userId = decoded.userId;
      req.context.userRole = decoded.role;
    } catch (error) {
      // Token invalid, but optional auth - continue without user
      logger.debug('Optional auth failed, continuing without user');
    }
  }

  next();
};
