const express = require('express');
const { getDb } = require('../db');
const { auth, roleAuth, ROLES } = require('../middleware/auth');

const router = express.Router();

router.get('/tiers', auth, roleAuth(ROLES.CHANNEL, ROLES.ADMIN), (req, res) => {
  try {
    const db = getDb();
    const tiers = db.prepare('SELECT * FROM channel_tiers ORDER BY id ASC').all();

    const result = tiers.map(t => ({
      ...t,
      benefits: JSON.parse(t.benefits || '{}')
    }));

    res.json({ tiers: result });
  } catch (err) {
    res.status(500).json({ error: '获取等级列表失败' });
  }
});

router.get('/stats', auth, roleAuth(ROLES.CHANNEL), (req, res) => {
  try {
    const db = getDb();
    const channel = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const tier = db.prepare('SELECT * FROM channel_tiers WHERE id = ?').get(channel.channel_tier);

    const orders = db.prepare(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE user_id = ?"
    ).get(req.user.id);

    const orderCount = db.prepare(
      "SELECT COUNT(*) as count FROM orders WHERE user_id = ?"
    ).get(req.user.id).count;

    const subChannels = db.prepare(
      "SELECT COUNT(*) as count FROM users WHERE role = 'channel' AND channel_tier < ?"
    ).get(tier?.id || 1).count;

    res.json({
      current_tier: tier ? {
        id: tier.id, name: tier.name, discount_rate: tier.discount_rate
      } : null,
      total_sales: orders.total / 100,
      order_count: orderCount,
      sub_channel_count: subChannels,
      next_tier: getNextTier(tier, orders.total),
      benefits: tier ? JSON.parse(tier.benefits || '{}') : {}
    });
  } catch (err) {
    res.status(500).json({ error: '获取统计失败' });
  }
});

function getNextTier(currentTier, currentSales) {
  const tiers = [
    { id: 1, name: '普通经销商', min_sales: 0 },
    { id: 2, name: '银牌经销商', min_sales: 100000 },
    { id: 3, name: '金牌经销商', min_sales: 500000 },
    { id: 4, name: '钻石经销商', min_sales: 2000000 },
  ];
  const currentIndex = tiers.findIndex(t => t.id === currentTier?.id) ?? 0;
  if (currentIndex < tiers.length - 1) {
    const next = tiers[currentIndex + 1];
    const needed = next.min_sales - (currentSales || 0);
    return {
      name: next.name,
      sales_needed: Math.max(0, needed / 100),
      progress: Math.min(100, Math.round((currentSales || 0) / next.min_sales * 100))
    };
  }
  return null;
}

router.get('/subordinates', auth, roleAuth(ROLES.CHANNEL, ROLES.ADMIN), (req, res) => {
  try {
    const db = getDb();

    const subs = db.prepare(
      "SELECT id, username, nickname, phone, channel_tier, created_at FROM users WHERE role = 'channel' AND id != ? ORDER BY created_at DESC LIMIT 20"
    ).all(req.user.id);

    res.json({ subordinates: subs });
  } catch (err) {
    res.status(500).json({ error: '获取下级列表失败' });
  }
});

module.exports = router;
