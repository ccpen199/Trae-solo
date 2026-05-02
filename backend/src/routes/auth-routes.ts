import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as bcrypt from 'bcryptjs';
import { knex } from '../database/connection';
import { generateToken, authenticate, UserPayload } from '../middleware/auth';
import { auditEngine } from '../engines/audit-engine';

const router = Router();

router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: '参数验证失败',
          details: errors.array(),
        });
        return;
      }

      const { username, password } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const user = await knex('users')
        .leftJoin('roles', 'users.role_id', '=', 'roles.id')
        .leftJoin('departments', 'users.department_id', '=', 'departments.id')
        .select(
          'users.id',
          'users.username',
          'users.password_hash as passwordHash',
          'users.name',
          'users.employee_id as employeeId',
          'users.role_id as roleId',
          'roles.code as roleCode',
          'roles.name as roleName',
          'users.department_id as departmentId',
          'departments.name as departmentName',
          'users.phone',
          'users.email',
          'users.gender',
          'users.certificate_number as certificateNumber',
          'users.professional_title as professionalTitle',
          'users.is_active as isActive',
          'users.is_locked as isLocked',
          'roles.permissions'
        )
        .where('users.username', username)
        .first();

      if (!user) {
        await auditEngine.log({
          userId: undefined,
          username: username,
          action: 'LOGIN_FAILED',
          module: 'AUTH',
          ipAddress,
          description: '登录失败：用户不存在',
        });

        res.status(401).json({
          success: false,
          error: '用户名或密码错误',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      if (!user.isActive) {
        await auditEngine.log({
          userId: user.id,
          username: user.username,
          action: 'LOGIN_FAILED',
          module: 'AUTH',
          ipAddress,
          description: '登录失败：用户已被禁用',
        });

        res.status(403).json({
          success: false,
          error: '账户已被禁用',
          code: 'USER_DISABLED',
        });
        return;
      }

      if (user.isLocked) {
        await auditEngine.log({
          userId: user.id,
          username: user.username,
          action: 'LOGIN_FAILED',
          module: 'AUTH',
          ipAddress,
          description: '登录失败：用户已被锁定',
        });

        res.status(403).json({
          success: false,
          error: '账户已被锁定',
          code: 'USER_LOCKED',
        });
        return;
      }

      const passwordValid = await bcrypt.compare(password, user.passwordHash);

      if (!passwordValid) {
        await auditEngine.log({
          userId: user.id,
          username: user.username,
          action: 'LOGIN_FAILED',
          module: 'AUTH',
          ipAddress,
          description: '登录失败：密码错误',
        });

        res.status(401).json({
          success: false,
          error: '用户名或密码错误',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      const token = generateToken({
        id: user.id,
        username: user.username,
        name: user.name,
      });

      await knex('users')
        .where('id', user.id)
        .update({
          last_login_at: new Date(),
          updated_at: new Date(),
        });

      await auditEngine.log({
        userId: user.id,
        username: user.username,
        action: 'LOGIN',
        module: 'AUTH',
        ipAddress,
        userAgent: req.headers['user-agent'],
        description: '用户登录成功',
      });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            employeeId: user.employeeId,
            role: {
              id: user.roleId,
              code: user.roleCode,
              name: user.roleName,
            },
            department: user.departmentId
              ? {
                  id: user.departmentId,
                  name: user.departmentName,
                }
              : undefined,
            phone: user.phone,
            email: user.email,
            gender: user.gender,
            certificateNumber: user.certificateNumber,
            professionalTitle: user.professionalTitle,
            permissions: user.permissions || {},
          },
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: '登录过程中发生错误',
        code: 'LOGIN_ERROR',
      });
    }
  }
);

router.post(
  '/logout',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as UserPayload;
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      await auditEngine.log({
        userId: user.id,
        username: user.username,
        action: 'LOGOUT',
        module: 'AUTH',
        ipAddress,
        userAgent: req.headers['user-agent'],
        description: '用户登出',
      });

      res.json({
        success: true,
        message: '登出成功',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: '登出过程中发生错误',
      });
    }
  }
);

router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as UserPayload;

      const userInfo = await knex('users')
        .leftJoin('roles', 'users.role_id', '=', 'roles.id')
        .leftJoin('departments', 'users.department_id', '=', 'departments.id')
        .select(
          'users.id',
          'users.username',
          'users.name',
          'users.employee_id as employeeId',
          'users.role_id as roleId',
          'roles.code as roleCode',
          'roles.name as roleName',
          'users.department_id as departmentId',
          'departments.name as departmentName',
          'users.phone',
          'users.email',
          'users.gender',
          'users.certificate_number as certificateNumber',
          'users.professional_title as professionalTitle',
          'users.is_active as isActive',
          'roles.permissions'
        )
        .where('users.id', user.id)
        .first();

      if (!userInfo) {
        res.status(404).json({
          success: false,
          error: '用户不存在',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: userInfo.id,
          username: userInfo.username,
          name: userInfo.name,
          employeeId: userInfo.employeeId,
          role: {
            id: userInfo.roleId,
            code: userInfo.roleCode,
            name: userInfo.roleName,
          },
          department: userInfo.departmentId
            ? {
                id: userInfo.departmentId,
                name: userInfo.departmentName,
              }
            : undefined,
          phone: userInfo.phone,
          email: userInfo.email,
          gender: userInfo.gender,
          certificateNumber: userInfo.certificateNumber,
          professionalTitle: userInfo.professionalTitle,
          permissions: userInfo.permissions || {},
        },
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: '获取用户信息失败',
      });
    }
  }
);

router.post(
  '/change-password',
  authenticate,
  [
    body('oldPassword').notEmpty().withMessage('旧密码不能为空'),
    body('newPassword').notEmpty().withMessage('新密码不能为空')
      .isLength({ min: 8 }).withMessage('新密码长度至少8位'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: '参数验证失败',
          details: errors.array(),
        });
        return;
      }

      const user = req.user as UserPayload;
      const { oldPassword, newPassword } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const userRecord = await knex('users')
        .select('password_hash as passwordHash')
        .where('id', user.id)
        .first();

      if (!userRecord) {
        res.status(404).json({
          success: false,
          error: '用户不存在',
        });
        return;
      }

      const passwordValid = await bcrypt.compare(oldPassword, userRecord.passwordHash);

      if (!passwordValid) {
        res.status(401).json({
          success: false,
          error: '旧密码错误',
        });
        return;
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      await knex('users')
        .where('id', user.id)
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date(),
        });

      await auditEngine.log({
        userId: user.id,
        username: user.username,
        action: 'PASSWORD_CHANGE',
        module: 'AUTH',
        ipAddress,
        description: '用户修改密码',
      });

      res.json({
        success: true,
        message: '密码修改成功',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: '修改密码失败',
      });
    }
  }
);

export default router;
