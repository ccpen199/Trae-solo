import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_HOURS = 1;

interface LoginError {
  code: string;
  message: string;
  retryable: boolean;
  remaining_attempts?: number;
  lock_until?: string;
  account_status?: string;
}

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] as string || '127.0.0.1';
  const ua = req.headers['user-agent'] || '';

  const logAttempt = (success: boolean, reason: string = '') => {
    try {
      db.prepare('INSERT INTO login_attempts (username, success, ip_address, user_agent, failure_reason) VALUES (?, ?, ?, ?, ?)').run(
        username || '', success ? 1 : 0, ip, ua, reason
      );
    } catch {}
  };

  if (!username || !password) {
    logAttempt(false, 'EMPTY_CREDENTIALS');
    return res.status(400).json({
      success: false,
      error: {
        code: 'EMPTY_CREDENTIALS',
        message: '请输入用户名和密码',
        retryable: true,
      } as LoginError
    });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

  if (!user) {
    logAttempt(false, 'USER_NOT_FOUND');
    return res.status(401).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: '账号不存在，请检查用户名或联系管理员注册',
        retryable: true,
        suggestion: '您可以使用 admin / platform / ops 等演示账号登录'
      } as LoginError
    });
  }

  if (user.status === 'disabled') {
    logAttempt(false, 'ACCOUNT_DISABLED');
    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCOUNT_DISABLED',
        message: '该账号已被禁用，请联系系统管理员',
        retryable: false,
        account_status: 'disabled'
      } as LoginError
    });
  }

  if (user.status === 'locked' && user.locked_until) {
    const now = new Date();
    const lockedUntil = new Date(user.locked_until);
    if (now < lockedUntil) {
      logAttempt(false, 'ACCOUNT_LOCKED');
      const remainingMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `密码错误次数过多，账号已锁定，请在 ${remainingMinutes} 分钟后重试`,
          retryable: false,
          lock_until: user.locked_until,
          remaining_minutes: remainingMinutes,
          account_status: 'locked'
        } as LoginError
      });
    } else {
      db.prepare('UPDATE users SET status = \'active\', failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
      user.status = 'active';
      user.failed_attempts = 0;
    }
  }

  const passwordValid = bcrypt.compareSync(password, user.password);

  if (!passwordValid) {
    const newAttempts = (user.failed_attempts || 0) + 1;
    const remaining = MAX_ATTEMPTS - newAttempts;

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockUntil = new Date();
      lockUntil.setHours(lockUntil.getHours() + LOCK_DURATION_HOURS);
      db.prepare('UPDATE users SET failed_attempts = ?, status = \'locked\', locked_until = ? WHERE id = ?').run(
        newAttempts, lockUntil.toISOString(), user.id
      );
      logAttempt(false, 'TOO_MANY_ATTEMPTS');
      return res.status(403).json({
        success: false,
        error: {
          code: 'TOO_MANY_ATTEMPTS',
          message: `密码错误已达 ${MAX_ATTEMPTS} 次，账号已锁定 ${LOCK_DURATION_HOURS} 小时`,
          retryable: false,
          lock_until: lockUntil.toISOString(),
          remaining_attempts: 0,
          account_status: 'locked'
        } as LoginError
      });
    }

    db.prepare('UPDATE users SET failed_attempts = ? WHERE id = ?').run(newAttempts, user.id);
    logAttempt(false, 'INVALID_PASSWORD');

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_PASSWORD',
        message: `密码错误，您还有 ${remaining} 次尝试机会`,
        retryable: true,
        remaining_attempts: remaining,
        account_status: 'active'
      } as LoginError
    });
  }

  if (user.status !== 'active') {
    db.prepare('UPDATE users SET status = \'active\', failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
  } else {
    db.prepare('UPDATE users SET failed_attempts = 0, last_login_at = datetime(\'now\') WHERE id = ?').run(user.id);
  }

  logAttempt(true);

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '7d' }
  );

  const roleName: Record<string, string> = {
    admin: '超级管理员',
    platform: '平台运营',
    ops: '运维工程师',
    user: '普通用户'
  };

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        role_name: roleName[user.role] || user.role,
        phone: user.phone,
        email: user.email,
        points: user.points,
        status: 'active',
        last_login_at: user.last_login_at
      },
      redirect_path: user.role === 'admin' ? '/dashboard' :
                     user.role === 'platform' ? '/services' :
                     user.role === 'ops' ? '/firmware' : '/dashboard'
    }
  });
});

router.get('/login/info', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      demo_accounts: [
        { username: 'admin', role: 'admin', desc: '超级管理员 - 全权限', password: 'Admin@123' },
        { username: 'platform', role: 'platform', desc: '平台运营 - 工单、商城、渠道', password: 'Admin@123' },
        { username: 'ops', role: 'ops', desc: '运维工程师 - 固件、健康、设备', password: 'Admin@123' },
        { username: 'user', role: 'user', desc: '普通用户 - 设备、场景、能耗', password: 'admin123' },
        { username: 'lockeduser', role: 'user', desc: '已锁定账号 - 用于演示锁定状态', password: 'Admin@123' }
      ],
      identity_types: [
        { type: 'home', label: '家庭用户', desc: '设备控制、场景联动、能耗监控', color: '#1890ff' },
        { type: 'channel', label: '渠道商', desc: '工单管理、商城分销、渠道数据', color: '#722ed1' },
        { type: 'engineer', label: '售后工程师', desc: '固件升级、健康诊断、远程运维', color: '#52c41a' },
      ],
      system_name: '海尔智家IoT生态统一控制平台',
      copyright: '© 2026 Haier Smart Home'
    }
  });
});

router.post('/register', (req: Request, res: Response) => {
  try {
    const {
      username, password, phone, email,
      identity_type,
      company_name, business_license, partner_type,
      real_name, certification_no, service_area,
      device_serial
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度至少6位' });
    }

    const validIdentityTypes = ['home', 'channel', 'engineer'];
    if (!identity_type || !validIdentityTypes.includes(identity_type)) {
      return res.status(400).json({ success: false, message: '请选择有效的身份类型（home/channel/engineer）' });
    }

    if (!phone) {
      return res.status(400).json({ success: false, message: '手机号不能为空' });
    }

    if (identity_type === 'channel') {
      if (!company_name) {
        return res.status(400).json({ success: false, message: '公司名称不能为空' });
      }
      if (!business_license) {
        return res.status(400).json({ success: false, message: '营业执照号不能为空' });
      }
    }

    if (identity_type === 'engineer') {
      if (!real_name) {
        return res.status(400).json({ success: false, message: '真实姓名不能为空' });
      }
      if (!certification_no) {
        return res.status(400).json({ success: false, message: '认证编号不能为空' });
      }
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ success: false, message: '用户名已存在' });
    }

    const identityToRole: Record<string, string> = {
      home: 'user',
      channel: 'platform',
      engineer: 'ops',
    };

    const role = identityToRole[identity_type];
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (
        username, password, role, phone, email, status,
        identity_type, company_name, business_license, partner_type,
        real_name, certification_no, service_area, device_serial, membership_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      username, hash, role, phone, email || null, 'active',
      identity_type, company_name || null, business_license || null, partner_type || null,
      real_name || null, certification_no || null, service_area || null,
      device_serial || null, 'standard'
    );

    const token = jwt.sign(
      { id: result.lastInsertRowid, username, role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    const roleName: Record<string, string> = {
      admin: '超级管理员',
      platform: '平台运营',
      ops: '运维工程师',
      user: '普通用户',
    };

    const redirectPath: Record<string, string> = {
      admin: '/dashboard',
      platform: '/services',
      ops: '/firmware',
      user: '/dashboard',
    };

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: result.lastInsertRowid,
          username,
          role,
          role_name: roleName[role],
          phone: phone || null,
          email: email || null,
          identity_type,
          membership_level: 'standard',
          points: 0,
        },
        redirect_path: redirectPath[role] || '/dashboard',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/me', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = db.prepare('SELECT id, username, role, phone, email, points, status, last_login_at, created_at, identity_type, membership_level, company_name, business_license, partner_type, real_name, certification_no, service_area, device_serial FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    const roleName: Record<string, string> = {
      admin: '超级管理员',
      platform: '平台运营',
      ops: '运维工程师',
      user: '普通用户'
    };
    res.json({
      success: true,
      data: {
        ...user,
        role_name: roleName[user.role] || user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
