const express = require('express');
const { User } = require('../models');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, adminOnly, async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  try {
    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;
    const { rows, count } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
    res.json({ list: rows.map(mapUser), total: count, page: parseInt(page, 10), pageSize: limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.userId !== req.params.id) {
    return res.status(403).json({ error: '无权访问' });
  }
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json(mapUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.userId !== req.params.id) {
    return res.status(403).json({ error: '无权修改' });
  }
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    const { realName, idCard, hasBankCard, phone } = req.body;
    await user.update({
      real_name: realName !== undefined ? realName : user.real_name,
      id_card: idCard !== undefined ? idCard : user.id_card,
      has_bank_card: hasBankCard !== undefined ? hasBankCard : user.has_bank_card,
      phone: phone !== undefined ? phone : user.phone,
    });

    const updated = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    res.json(mapUser(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/verify-idcard', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    await user.update({ id_card_verified: true });
    res.json({ message: '身份证验证已通过' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/wallet', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.userId !== req.params.id) {
    return res.status(403).json({ error: '无权访问' });
  }
  try {
    const user = await User.findByPk(req.params.id, { attributes: ['id', 'wallet_balance'] });
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/wallet/recharge', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.userId !== req.params.id) {
    return res.status(403).json({ error: '无权操作' });
  }
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: '充值金额必须大于0' });

  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    await user.update({ wallet_balance: parseFloat(user.wallet_balance) + parseFloat(amount) });
    res.json({ balance: user.wallet_balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapUser(row) {
  const u = typeof row.toJSON === 'function' ? row.toJSON() : row;
  return {
    ...u,
    realName: u.real_name,
    idCard: u.id_card,
    idCardVerified: u.id_card_verified,
    hasBankCard: u.has_bank_card,
    walletBalance: u.wallet_balance,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  };
}

module.exports = router;
