import { Router } from 'express';
import { getDatabase } from '../database';
import { logger } from '../logger';
import { config } from '../config';
import { comparePassword, generateCode } from '../utils';
import { asyncHandler, AuthenticatedRequest } from '../middleware';
import { UnauthorizedError, BadRequestError } from '../errors';
import * as jwt from 'jsonwebtoken';

export const authRouter = Router();

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new BadRequestError('用户名和密码不能为空');
    }

    const db = getDatabase();

    const user = db.prepare(`
      SELECT u.id, u.username, u.password_hash, u.email, u.phone, u.real_name, u.status,
             r.id as role_id, r.role_code, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.username = ?
    `).get(username) as any;

    if (!user) {
      throw new UnauthorizedError('用户名或密码错误');
    }

    if (user.status !== 1) {
      throw new UnauthorizedError('用户已被禁用');
    }

    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('用户名或密码错误');
    }

    const permissions = db.prepare(`
      SELECT p.permission_code
      FROM role_permissions rp
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `).all(user.role_id) as any[];

    const permissionCodes = permissions.map((p: any) => p.permission_code);

    const payload = {
      userId: user.id,
      username: user.username,
      roleId: user.role_id,
      roleCode: user.role_code,
      permissions: permissionCodes,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const response = {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          realName: user.real_name,
          role: {
            id: user.role_id,
            code: user.role_code,
            name: user.role_name,
          },
        },
        permissions: permissionCodes,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

authRouter.get(
  '/me',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw new UnauthorizedError('用户未认证');
    }

    const db = getDatabase();
    const user = db.prepare(`
      SELECT u.id, u.username, u.email, u.phone, u.real_name,
             r.id as role_id, r.role_code, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).get(req.user.userId) as any;

    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }

    const permissions = db.prepare(`
      SELECT p.permission_code
      FROM role_permissions rp
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `).all(user.role_id) as any[];

    const permissionCodes = permissions.map((p: any) => p.permission_code);

    const response = {
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          realName: user.real_name,
          role: {
            id: user.role_id,
            code: user.role_code,
            name: user.role_name,
          },
        },
        permissions: permissionCodes,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);
