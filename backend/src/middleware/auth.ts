import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@config/index';
import { User, IUser, UserRole } from '@models/User';
import { logger } from '@utils/logger';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
  userRole?: UserRole;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
        code: 'NO_TOKEN',
      });
    }

    const token = authHeader.substring(7);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '认证令牌格式错误',
        code: 'INVALID_TOKEN_FORMAT',
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      role: UserRole;
      iat: number;
      exp: number;
    };

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用',
        code: 'ACCOUNT_DISABLED',
      });
    }

    req.user = user;
    req.userId = user._id.toString();
    req.userRole = user.role;

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: '认证令牌无效',
        code: 'INVALID_TOKEN',
      });
    }
    return res.status(401).json({
      success: false,
      message: '认证失败',
      code: 'AUTH_FAILED',
    });
  }
};

export const roleMiddleware = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: '未认证',
        code: 'UNAUTHENTICATED',
      });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'PERMISSION_DENIED',
        requiredRoles: roles,
        currentRole: req.userRole,
      });
    }

    next();
  };
};

export const studentOnly = roleMiddleware('student', 'admin');
export const operatorOnly = roleMiddleware('operator', 'admin');
export const investorOnly = roleMiddleware('investor', 'admin');
export const adminOnly = roleMiddleware('admin');

export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token) {
        const decoded = jwt.verify(token, config.jwt.secret) as {
          userId: string;
          role: UserRole;
        };

        const user = await User.findById(decoded.userId);
        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id.toString();
          req.userRole = user.role;
        }
      }
    }
  } catch (error) {
    logger.warn('Optional auth failed, continuing without auth:', error);
  }
  next();
};

const parseExpiresIn = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const match = value.match(/^(\d+)([smhdwy])?$/);
  if (!match) return 7 * 24 * 60 * 60;
  const num = parseInt(match[1]);
  const unit = match[2] || 's';
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
    w: 7 * 24 * 60 * 60,
    y: 365 * 24 * 60 * 60,
  };
  return num * (multipliers[unit] || 1);
};

export const generateToken = (userId: string, role: UserRole): string => {
  return jwt.sign(
    {
      userId,
      role,
    },
    config.jwt.secret,
    {
      expiresIn: parseExpiresIn(config.jwt.expiresIn),
    }
  );
};

export const generateRefreshToken = (userId: string, role: UserRole): string => {
  return jwt.sign(
    {
      userId,
      role,
      type: 'refresh',
    },
    config.jwt.refreshSecret,
    {
      expiresIn: parseExpiresIn(config.jwt.refreshExpiresIn),
    }
  );
};

export const verifyRefreshToken = (refreshToken: string): { userId: string; role: UserRole } | null => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
      userId: string;
      role: UserRole;
      type: string;
    };
    if (decoded.type !== 'refresh') {
      return null;
    }
    return {
      userId: decoded.userId,
      role: decoded.role,
    };
  } catch (error) {
    logger.error('Verify refresh token error:', error);
    return null;
  }
};
