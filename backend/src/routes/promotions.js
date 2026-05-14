const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { requireAuth } = require('../middleware/auth');

router.get('/coupons', (req, res) => {
  const db = getDb();

  const coupons = db.prepare(`
    SELECT * FROM coupons 
    WHERE status = 1 
    AND start_time <= datetime('now') 
    AND end_time >= datetime('now')
    ORDER BY min_amount ASC
  `).all();

  res.json({
    success: true,
    data: coupons.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      discount_value: c.discount_value,
      min_amount: c.min_amount,
      total_count: c.total_count,
      claimed_count: c.claimed_count,
      remaining_count: c.total_count - c.claimed_count,
      start_time: c.start_time,
      end_time: c.end_time
    }))
  });
});

router.post('/coupons/:couponId/claim', requireAuth, (req, res) => {
  const { couponId } = req.params;
  const db = getDb();
  const userId = req.user.id;

  const coupon = db.prepare(`
    SELECT * FROM coupons 
    WHERE id = ? AND status = 1
    AND start_time <= datetime('now') 
    AND end_time >= datetime('now')
  `).get(couponId);

  if (!coupon) {
    return res.status(400).json({ error: '优惠券不存在或已过期' });
  }

  if (coupon.claimed_count >= coupon.total_count) {
    return res.status(400).json({ error: '优惠券已领完' });
  }

  const alreadyClaimed = db.prepare(`
    SELECT * FROM user_coupons 
    WHERE user_id = ? AND coupon_id = ?
  `).get(userId, couponId);

  if (alreadyClaimed) {
    return res.status(400).json({ error: '您已领取过该优惠券' });
  }

  db.transaction(() => {
    db.prepare(`
      INSERT INTO user_coupons (user_id, coupon_id)
      VALUES (?, ?)
    `).run(userId, couponId);

    db.prepare('UPDATE coupons SET claimed_count = claimed_count + 1 WHERE id = ?').run(couponId);
  })();

  res.json({
    success: true,
    message: '领取成功'
  });
});

router.get('/my-coupons', requireAuth, (req, res) => {
  const { status } = req.query;
  const db = getDb();
  const userId = req.user.id;

  let whereClause = 'uc.user_id = ?';
  let params = [userId];

  if (status) {
    whereClause += ' AND uc.status = ?';
    params.push(status);
  }

  const userCoupons = db.prepare(`
    SELECT uc.*, c.name, c.discount_value, c.min_amount, c.start_time, c.end_time
    FROM user_coupons uc
    JOIN coupons c ON uc.coupon_id = c.id
    WHERE ${whereClause}
    ORDER BY uc.created_at DESC
  `).all(...params);

  res.json({
    success: true,
    data: userCoupons.map(c => ({
      id: c.id,
      name: c.name,
      discount_value: c.discount_value,
      min_amount: c.min_amount,
      status: c.status,
      used_time: c.used_time,
      start_time: c.start_time,
      end_time: c.end_time,
      created_at: c.created_at
    }))
  });
});

router.get('/flash-sale', (req, res) => {
  const db = getDb();

  const products = db.prepare(`
    SELECT * FROM products 
    WHERE is_on_sale = 1 
    AND stock > 0 
    AND activity_price IS NOT NULL
    ORDER BY (original_price - activity_price) DESC
    LIMIT 20
  `).all();

  res.json({
    success: true,
    data: products.map(p => ({
      id: p.id,
      name: p.name,
      original_price: p.original_price,
      activity_price: p.activity_price,
      discount: Math.round((1 - p.activity_price / p.original_price) * 100),
      stock: p.stock,
      images: p.images,
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }))
  });
});

module.exports = router;
