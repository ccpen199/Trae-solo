import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiError, asyncHandler } from './errorHandler';
import { prisma } from '../lib/prisma';

interface JwtPayload {
  developerId: string;
  email: string;
  level: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      developer?: {
        id: string;
        email: string;
        level: string;
      };
      app?: {
        id: string;
        appKey: string;
        developerId: string;
        status: string;
        approvedScopes: string[];
      };
    }
  }
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });
};

export const authenticateJwt = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('缺少认证令牌');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

      const developer = await prisma.developer.findUnique({
        where: { id: decoded.developerId }
      });

      if (!developer) {
        throw ApiError.unauthorized('开发者不存在');
      }

      req.developer = {
        id: developer.id,
        email: developer.email,
        level: developer.level
      };

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.unauthorized('令牌无效或已过期');
    }
  }
);

export const authenticateAppKey = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const appKey = req.headers['x-app-key'] as string;

    if (!appKey) {
      throw ApiError.unauthorized('缺少App Key');
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        key: appKey,
        isActive: true
      },
      include: {
        application: true
      }
    });

    if (!apiKey) {
      throw ApiError.unauthorized('无效的App Key');
    }

    if (!apiKey.application) {
      throw ApiError.unauthorized('应用不存在');
    }

    if (apiKey.application.status !== 'ACTIVE') {
      throw ApiError.forbidden('应用未激活或已被禁用');
    }

    const appData = apiKey.application as any;
    req.app = {
      id: String(appData.id),
      appKey: String(appData.appKey),
      developerId: String(appData.developerId),
      status: String(appData.status),
      approvedScopes: Array.isArray(appData.approvedScopes) ? appData.approvedScopes : []
    } as any;

    next();
  }
);

export const requireDeveloperLevel = (requiredLevel: string) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.developer) {
        throw ApiError.unauthorized('需要认证');
      }

      const levelPriority: Record<string, number> = {
        REGULAR: 1,
        ADVANCED: 2,
        PLATINUM: 3,
        CERTIFIED: 4
      };

      const userLevel = levelPriority[req.developer.level] || 0;
      const requiredLevelPriority = levelPriority[requiredLevel] || 0;

      if (userLevel < requiredLevelPriority) {
        throw ApiError.forbidden(`需要${requiredLevel}等级权限`);
      }

      next();
    }
  );
};
