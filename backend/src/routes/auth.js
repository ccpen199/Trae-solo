const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, sensitiveOperation } = require('../middleware/auth');
const { auditLog, generateWatermark } = require('../middleware/audit');

const router = express.Router();
const prisma = new PrismaClient();

const roleRedirectMap = {
  user: '/',
  enterprise: '/enterprise',
  admin: '/admin',
};

const roleNameMap = {
  user: '职场人',
  enterprise: '企业HR',
  admin: '福利商城运营',
};

router.post('/login', async (req, res) => {
  const loginStart = Date.now();
  try {
    const { email, password, role } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    if (!email || !password) {
      return res.status(400).json({
        code: 'MISSING_CREDENTIALS',
        message: '请输入邮箱和密码',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { enterprise: true },
    });

    if (!user) {
      await prisma.auditLog.create({
        data: {
          userId: 'system',
          action: 'LOGIN_FAILED_NO_USER',
          resource: 'auth',
          ip,
          userAgent,
          watermark: generateWatermark('anonymous', 'LOGIN_FAILED_NO_USER', loginStart),
          secondVerified: false,
          detail: JSON.stringify({ attemptedEmail: email, role }),
        },
      }).catch(() => {});

      return res.status(401).json({
        code: 'USER_NOT_FOUND',
        message: '账号不存在，请检查邮箱或注册新账号',
        suggestion: '如未注册，可点击下方"立即注册"创建账号',
      });
    }

    if (role && user.role !== role) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED_ROLE_MISMATCH',
          resource: 'auth',
          ip,
          userAgent,
          watermark: generateWatermark(user.id, 'LOGIN_FAILED_ROLE_MISMATCH', loginStart),
          secondVerified: false,
          detail: JSON.stringify({ expectedRole: role, actualRole: user.role }),
        },
      }).catch(() => {});

      return res.status(403).json({
        code: 'ROLE_MISMATCH',
        message: `当前账号身份为「${roleNameMap[user.role]}」，与选择的「${roleNameMap[role]}」不匹配`,
        suggestion: '请切换到正确的身份入口登录，或联系管理员核实账号权限',
        actualRole: user.role,
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED_WRONG_PASSWORD',
          resource: 'auth',
          ip,
          userAgent,
          watermark: generateWatermark(user.id, 'LOGIN_FAILED_WRONG_PASSWORD', loginStart),
          secondVerified: false,
        },
      }).catch(() => {});

      return res.status(401).json({
        code: 'WRONG_PASSWORD',
        message: '密码错误，请重新输入',
        suggestion: '如忘记密码，可通过邮箱重置，或使用"123456"（测试账号）',
        remainingAttempts: 5,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, enterpriseId: user.enterpriseId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        resource: 'auth',
        ip,
        userAgent,
        watermark: generateWatermark(user.id, 'LOGIN_SUCCESS', loginStart),
        secondVerified: false,
        detail: JSON.stringify({ role: user.role, loginAt: new Date().toISOString() }),
      },
    }).catch(() => {});

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleName: roleNameMap[user.role],
        enterprise: user.enterprise,
      },
      redirectUrl: roleRedirectMap[user.role],
      permissions: {
        canAccessSocialSecurity: user.role === 'user',
        canAccessAIInterview: user.role === 'user',
        canAccessCompliance: ['user', 'enterprise'].includes(user.role),
        canAccessEnterprise: ['enterprise', 'admin'].includes(user.role),
        canAccessAdmin: user.role === 'admin',
        canAccessMall: true,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      code: 'SYSTEM_ERROR',
      message: '登录服务异常，请稍后重试',
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, phone, name, password, role } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
      return res.status(400).json({ error: '邮箱或手机号已注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name,
        passwordHash: hashedPassword,
        role: role || 'user',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { enterprise: true },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      socialSecurityBase: user.socialSecurityBase,
      resignationRisk: user.resignationRisk,
      enterprise: user.enterprise,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

router.post('/2fa/verify', authenticateToken, sensitiveOperation, auditLog('2FA_VERIFY', 'user'), (req, res) => {
  res.json({ success: true, message: '二次验证通过' });
});

module.exports = router;
