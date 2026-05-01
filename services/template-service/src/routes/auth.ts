import { Router } from 'express';
import { query, comparePassword, generateCode, ApiResponse } from '@sms-platform/shared';
import * as jwt from 'jsonwebtoken';
import { config, logger, asyncHandler, BadRequestError, UnauthorizedError, ValidationError, validateRequestBody } from '@sms-platform/shared';

export const authRouter = Router();

authRouter.post(
  '/login',
  validateRequestBody({
    username: { required: true, type: 'string', minLength: 1, maxLength: 100 },
    password: { required: true, type: 'string', minLength: 1, maxLength: 255 },
  }),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const users = await query(`
      SELECT u.id, u.username, u.password_hash, u.email, u.phone, u.real_name, u.status,
             r.id as role_id, r.role_code, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.username = ?
    `, [username]);

    if (users.length === 0) {
      throw new UnauthorizedError('用户名或密码错误');
    }

    const user = users[0];

    if (user.status !== 1) {
      throw new UnauthorizedError('用户已被禁用');
    }

    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('用户名或密码错误');
    }

    const permissions = await query(`
      SELECT p.permission_code
      FROM role_permissions rp
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `, [user.role_id]);

    const permissionCodes = permissions.map((p: any) => p.permission_code);

    const payload = {
      userId: user.id,
      username: user.username,
      roleId: user.role_id,
      roleCode: user.role_code,
      permissions: permissionCodes,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const response: ApiResponse = {
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

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('缺少认证令牌');
    }

    const oldToken = authHeader.substring(7);

    try {
      const payload = jwt.verify(oldToken, config.jwt.secret, { ignoreExpiration: true }) as any;

      const users = await query(`
        SELECT u.id, u.username, u.status, r.id as role_id, r.role_code, r.role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `, [payload.userId]);

      if (users.length === 0 || users[0].status !== 1) {
        throw new UnauthorizedError('用户不存在或已被禁用');
      }

      const permissions = await query(`
        SELECT p.permission_code
        FROM role_permissions rp
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
      `, [payload.roleId]);

      const permissionCodes = permissions.map((p: any) => p.permission_code);

      const newPayload = {
        userId: payload.userId,
        username: payload.username,
        roleId: payload.roleId,
        roleCode: payload.roleCode,
        permissions: permissionCodes,
      };

      const newToken = jwt.sign(newPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          token: newToken,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      throw new UnauthorizedError('无效的令牌');
    }
  })
);

authRouter.get(
  '/me',
  asyncHandler(async (req: any, res) => {
    if (!req.user) {
      throw new UnauthorizedError('用户未认证');
    }

    const users = await query(`
      SELECT u.id, u.username, u.email, u.phone, u.real_name,
             r.id as role_id, r.role_code, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [req.user.userId]);

    if (users.length === 0) {
      throw new UnauthorizedError('用户不存在');
    }

    const user = users[0];

    const permissions = await query(`
      SELECT p.permission_code
      FROM role_permissions rp
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `, [user.role_id]);

    const permissionCodes = permissions.map((p: any) => p.permission_code);

    const response: ApiResponse = {
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
