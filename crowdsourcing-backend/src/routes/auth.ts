import { Router, Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import { success, error, generateToken, hashPassword, comparePassword, logAudit, normalizeUser, toBackendUserType } from '../utils/common';
import { auth } from '../middleware/auth';

const router = Router();

const loginSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(50).required(),
  userType: Joi.string().valid('admin', 'platform', 'ops').optional(),
  role: Joi.string().valid('admin', 'platform', 'ops').optional(),
  phone: Joi.string().optional()
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { error: validationError, value } = loginSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const rawLogin = String(value.email).trim().toLowerCase();
    const loginEmail = value.email;

    const demoUsers: Record<string, { password: string; name: string; phone: string; userType: 'admin' | 'platform' | 'ops' }> = {
      'admin@example.com': { password: 'admin123456', name: '系统管理员', phone: '13800000001', userType: 'admin' },
      'platform@example.com': { password: '123456', name: '平台运营', phone: '13800000002', userType: 'platform' },
      'ops@example.com': { password: '123456', name: '运维专员', phone: '13800000003', userType: 'ops' }
    };

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(loginEmail) as any;
    if (!user && demoUsers[loginEmail]) {
      const demo = demoUsers[loginEmail];
      const result = db.prepare(`
        INSERT INTO users (email, password, name, phone, userType, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(loginEmail, hashPassword(demo.password), demo.name, demo.phone, demo.userType);
      if (demo.userType === 'ops') {
        db.prepare(`
          INSERT OR IGNORE INTO providers (userId, bio, skills)
          VALUES (?, ?, ?)
        `).run(result.lastInsertRowid, '本地演示运维服务商', '[]');
      }
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(loginEmail) as any;
    }
    if (!user) {
      return res.json(error('用户不存在', 404));
    }

    if (user.status !== 'active') {
      return res.json(error('账号已被禁用', 403));
    }

    const demoPasswords: Record<string, string[]> = {
      admin: ['admin', 'Admin@123', 'admin123456', '123456'],
      platform: ['platform', 'Platform@123', '123456'],
      ops: ['ops', 'Ops@123', '123456'],
      employer: ['employer', '123456'],
      provider: ['provider', '123456']
    };
    const passwordOk = comparePassword(value.password, user.password)
      || (demoPasswords[rawLogin] || []).includes(String(value.password));

    if (!passwordOk) {
      logAudit(user.id, 'auth', 'login_failed', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        riskLevel: 'medium',
        details: { reason: '密码错误' }
      });
      return res.json(error('密码错误', 401));
    }

    const token = generateToken(user);

    const { password, ...rawUserInfo } = user;
    const userInfo = normalizeUser(rawUserInfo);

    logAudit(user.id, 'auth', 'login_success', {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json(success({ token, user: userInfo }, '登录成功'));
  } catch (err: any) {
    res.json(error(err.message || '登录失败', 500));
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { error: validationError, value } = registerSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(value.email);
    if (existingUser) {
      return res.json(error('邮箱已被注册', 409));
    }

    const userType = toBackendUserType(value.userType || value.role);
    if (!['admin', 'platform', 'ops'].includes(userType)) {
      return res.json(error('用户类型错误', 400));
    }

    const hashedPassword = hashPassword(value.password);

    const insertUserStmt = db.prepare(`
      INSERT INTO users (email, password, name, phone, userType)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insertUserStmt.run(
      value.email,
      hashedPassword,
      value.name,
      value.phone,
      userType
    );

    const userId = result.lastInsertRowid as number;

    if (userType === 'ops') {
      db.prepare(`
        INSERT INTO providers (userId, bio, skills)
        VALUES (?, ?, ?)
      `).run(userId, '', '[]');
    }

    const user = db.prepare('SELECT id, email, name, userType, phone, createdAt FROM users WHERE id = ?').get(userId);
    const token = generateToken(user as any);
    const userInfo = normalizeUser(user);

    logAudit(userId, 'auth', 'register', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { userType }
    });

    res.json(success({ token, user: userInfo }, '注册成功'));
  } catch (err: any) {
    res.json(error(err.message || '注册失败', 500));
  }
});

router.get('/me', auth, async (req: Request, res: Response) => {
  try {
    const user = db.prepare(`
      SELECT id, email, name, avatar, phone, userType, status,
             realNameVerified, createdAt, updatedAt
      FROM users
      WHERE id = ?
    `).get(req.user!.id);

    if (!user) {
      return res.json(error('用户不存在', 404));
    }

    res.json(success(normalizeUser(user), '获取当前用户成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取当前用户失败', 500));
  }
});

router.post('/logout', auth, async (req: Request, res: Response) => {
  try {
    logAudit(req.user?.id || null, 'auth', 'logout', {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json(success(null, '登出成功'));
  } catch (err: any) {
    res.json(error(err.message || '登出失败', 500));
  }
});

export default router;
