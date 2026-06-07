const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ccb-life-secret-2024';

router.post(
  '/register',
  [body('phone').notEmpty().withMessage('手机号不能为空'), body('password').isLength({ min: 6 }).withMessage('密码至少6位')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { phone, password, realName, idCard, hasBankCard } = req.body;
    try {
      const exists = await User.findOne({ where: { phone } });
      if (exists) return res.status(409).json({ error: '该手机号已注册' });

      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({
        phone,
        password: hashed,
        real_name: realName || null,
        id_card: idCard || null,
        has_bank_card: hasBankCard || false,
      });

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          realName: user.real_name,
          idCard: user.id_card,
          idCardVerified: user.id_card_verified,
          hasBankCard: user.has_bank_card,
          walletBalance: user.wallet_balance,
          status: user.status,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post('/login', [body('phone').notEmpty().withMessage('手机号不能为空').isMobilePhone('zh-CN').withMessage('请输入正确的11位手机号'), body('password').notEmpty().withMessage('密码不能为空').isLength({ min: 6 }).withMessage('密码至少6位')], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { phone, password } = req.body;
  try {
    const user = await User.findOne({ where: { phone } });
    if (!user) return res.status(401).json({ error: '手机号或密码错误', code: 'AUTH_FAILED' });

    if (user.status === 'disabled') return res.status(403).json({ error: '该账号已被禁用，请联系管理员', code: 'ACCOUNT_DISABLED' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: '手机号或密码错误', code: 'AUTH_FAILED' });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const rolePermissions = {
      admin: ['provider_audit', 'fee_config', 'arbitration', 'reports', 'risk_events', 'user_manage', 'provider_manage', 'product_manage', 'order_manage'],
      merchant: ['provider_manage', 'product_manage', 'order_manage'],
      user: ['order_manage', 'wallet', 'coupon'],
    };

    const roleWorkbench = {
      admin: '/providers/audit',
      merchant: '/products',
      user: '/orders',
    };

    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        realName: user.real_name,
        idCard: user.id_card,
        idCardVerified: user.id_card_verified,
        hasBankCard: user.has_bank_card,
        walletBalance: user.wallet_balance,
        status: user.status,
      },
      permissions: rolePermissions[user.role] || [],
      workbenchPath: roleWorkbench[user.role] || '/dashboard',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password'] },
    });
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
