const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../utils/db');
const { success, error } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const vipPlans = [
  {
    id: 'monthly',
    name: '月卡会员',
    price: 18,
    durationDays: 30,
    description: '30天VIP会员权益'
  },
  {
    id: 'quarterly',
    name: '季卡会员',
    price: 45,
    durationDays: 90,
    description: '90天VIP会员权益'
  },
  {
    id: 'yearly',
    name: '年卡会员',
    price: 168,
    durationDays: 365,
    description: '365天VIP会员权益，额外赠送误删数据找回服务'
  }
];

const vipBenefits = [
  { id: 1, name: '超大云空间', description: '10GB云存储空间', free: '500MB' },
  { id: 2, name: '历史版本', description: '无限次查看和恢复笔记历史版本', free: '不支持' },
  { id: 3, name: '思维导图', description: '支持思维导图样式导出和查看', free: '基础样式' },
  { id: 4, name: '加密分享', description: '支持密码保护和有效期设置的分享链接', free: '不支持' },
  { id: 5, name: 'OCR搜索', description: '图片文字识别和搜索', free: '不支持' },
  { id: 6, name: '误删找回', description: '年卡会员专享：误删数据找回服务', free: '不支持' },
  { id: 7, name: '专属客服', description: 'VIP会员专属客服支持', free: '基础客服' }
];

router.get('/plans', (req, res) => {
  res.json(success({ plans: vipPlans }));
});

router.get('/benefits', (req, res) => {
  res.json(success({ benefits: vipBenefits }));
});

router.post('/order', requireAuth, [
  body('planId').notEmpty().withMessage('套餐ID不能为空')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(error('参数验证失败', errors.array()));
  }

  const { planId } = req.body;
  const plan = vipPlans.find(p => p.id === planId);

  if (!plan) {
    return res.status(400).json(error('无效的套餐ID'));
  }

  try {
    const orderId = uuidv4();
    const db = getDB();
    const now = Date.now();

    db.prepare(`
      INSERT INTO vip_orders (id, user_id, plan_type, amount, duration_days, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).run(orderId, req.user.id, planId, plan.price, plan.durationDays, now);

    res.json(success({
      orderId,
      plan,
      amount: plan.price
    }, '订单创建成功'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('创建订单失败'));
  }
});

router.post('/pay/:orderId', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const order = db.prepare('SELECT * FROM vip_orders WHERE id = ? AND user_id = ?').get(req.params.orderId, req.user.id);

    if (!order) {
      return res.status(404).json(error('订单不存在'));
    }

    if (order.status === 'paid') {
      return res.status(400).json(error('订单已支付'));
    }

    const now = Date.now();
    db.prepare('UPDATE vip_orders SET status = ?, paid_at = ? WHERE id = ?').run('paid', now, order.id);

    const currentUser = db.prepare('SELECT vip_type, vip_expire_at FROM users WHERE id = ?').get(req.user.id);
    const currentExpire = currentUser.vip_expire_at && currentUser.vip_expire_at > now ? currentUser.vip_expire_at : now;
    const newExpire = currentExpire + (order.duration_days * 24 * 60 * 60 * 1000);
    const vipType = order.plan_type === 'yearly' ? 2 : 1;

    db.prepare('UPDATE users SET vip_type = ?, vip_expire_at = ?, updated_at = ? WHERE id = ?').run(
      vipType, newExpire, now, req.user.id
    );

    const user = db.prepare('SELECT id, phone, email, nickname, avatar, vip_type, vip_expire_at, used_space FROM users WHERE id = ?').get(req.user.id);
    const maxSpace = parseInt(process.env.MAX_VIP_SPACE);

    res.json(success({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        vipType: user.vip_type,
        vipExpireAt: user.vip_expire_at,
        usedSpace: user.used_space,
        maxSpace
      }
    }, '支付成功，会员已开通'));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('支付失败'));
  }
});

router.get('/orders', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const orders = db.prepare(`
      SELECT * FROM vip_orders 
      WHERE user_id = ? AND status = 'paid'
      ORDER BY paid_at DESC
    `).all(req.user.id);

    res.json(success({ orders }));
  } catch (err) {
    console.error(err);
    res.status(500).json(error('获取订单列表失败'));
  }
});

module.exports = router;
