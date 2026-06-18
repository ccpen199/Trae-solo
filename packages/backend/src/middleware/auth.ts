import type { Request, Response, NextFunction } from 'express';
import type { UserRole, User } from '@neighborhood/shared';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../config/database.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

interface JwtPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, message: 'No token provided' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ code: 401, message: 'User not found' });
    }

    if (user.status === 'banned' || user.status === 'suspended') {
      return res.status(403).json({ code: 403, message: 'Account is suspended or banned' });
    }

    req.user = user as User;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ code: 401, message: 'Invalid token' });
    }
    next(error);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: 'Insufficient permissions' });
    }

    next();
  };
}

export function samlCallbackHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const samlResponse = req.body.SAMLResponse;
    if (!samlResponse) {
      return res.status(400).json({ code: 400, message: 'Missing SAML response' });
    }

    const buffer = Buffer.from(samlResponse, 'base64');
    const xml = buffer.toString('utf-8');

    const nameIdMatch = xml.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/);
    const nameId = nameIdMatch?.[1];

    if (!nameId) {
      return res.status(400).json({ code: 400, message: 'Invalid SAML response: missing NameID' });
    }

    req.body.samlIdentityId = nameId;
    next();
  } catch (error) {
    next(error);
  }
}
