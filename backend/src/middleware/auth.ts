import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import { knex } from '../database/connection';

export interface UserPayload {
  id: string;
  username: string;
  name: string;
  roleId: string;
  roleCode: string;
  departmentId?: string;
  permissions: Record<string, string[]>;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: '未提供认证令牌',
        code: 'AUTH_TOKEN_MISSING',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      const user = await knex('users')
        .join('roles', 'users.role_id', '=', 'roles.id')
        .leftJoin('departments', 'users.department_id', '=', 'departments.id')
        .select(
          'users.id',
          'users.username',
          'users.name',
          'users.role_id',
          'roles.code as role_code',
          'users.department_id',
          'roles.permissions',
          'users.is_active',
          'users.is_locked'
        )
        .where('users.id', decoded.userId)
        .first();

      if (!user) {
        res.status(401).json({
          success: false,
          error: '用户不存在',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      if (!user.is_active) {
        res.status(401).json({
          success: false,
          error: '用户已被禁用',
          code: 'USER_DISABLED',
        });
        return;
      }

      if (user.is_locked) {
        res.status(401).json({
          success: false,
          error: '用户账户已被锁定',
          code: 'USER_LOCKED',
        });
        return;
      }

      req.user = {
        id: user.id,
        username: user.username,
        name: user.name,
        roleId: user.role_id,
        roleCode: user.role_code,
        departmentId: user.department_id,
        permissions: user.permissions || {},
      };

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: '认证令牌无效或已过期',
        code: 'AUTH_TOKEN_INVALID',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '认证过程中发生错误',
      code: 'AUTH_ERROR',
    });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      const user = await knex('users')
        .join('roles', 'users.role_id', '=', 'roles.id')
        .select(
          'users.id',
          'users.username',
          'users.name',
          'users.role_id',
          'roles.code as role_code',
          'users.department_id',
          'roles.permissions'
        )
        .where('users.id', decoded.userId)
        .first();

      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          name: user.name,
          roleId: user.role_id,
          roleCode: user.role_code,
          departmentId: user.department_id,
          permissions: user.permissions || {},
        };
      }
    }

    next();
  } catch {
    next();
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!roles.includes(req.user.roleCode)) {
      res.status(403).json({
        success: false,
        error: '权限不足',
        code: 'PERMISSION_DENIED',
      });
      return;
    }

    next();
  };
};

export const requirePermission = (module: string, permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const permissions = req.user.permissions;
    const modulePermissions = permissions[module] || [];

    if (!modulePermissions.includes(permission) && !modulePermissions.includes('*')) {
      res.status(403).json({
        success: false,
        error: '权限不足',
        code: 'PERMISSION_DENIED',
        details: `需要 ${module}:${permission} 权限`,
      });
      return;
    }

    next();
  };
};

export const generateToken = (user: {
  id: string;
  username: string;
  name: string;
}): string => {
  return (jwt as any).sign(
    {
      userId: user.id,
      username: user.username,
      name: user.name,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    }
  );
};
