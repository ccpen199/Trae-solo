const express = require('express');
const router = express.Router();
const { authenticate, success, error, query, queryOne, execute } = require('../utils');

router.get('/', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const coupons = await query('SELECT * FROM coupons WHERE status = 1 AND start_time <= ? AND end_time >= ? ORDER BY created_at DESC', [now, now]);
    res.json(success(coupons));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.get('/mine', authenticate, async (req, res) => {
  try {
    const userCoupons = await query('SELECT uc.*, c.name, c.type, c.amount, c.min_amount, c.end_time FROM user_coupons uc LEFT JOIN coupons c ON uc.coupon_id = c.id WHERE uc.user_id = ? ORDER BY uc.created_at DESC', [req.userId]);
    res.json(success(userCoupons));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.post('/:id/receive', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const coupon = await queryOne('SELECT * FROM coupons WHERE id = ? AND status = 1', [id]);
    if (!coupon) return res.json(error('优惠券不存在'));
    
    const now = new Date().toISOString();
    if (coupon.start_time > now) return res.json(error('优惠券尚未开始'));
    if (coupon.end_time < now) return res.json(error('优惠券已过期'));
    
    const userCoupon = await queryOne('SELECT * FROM user_coupons WHERE user_id = ? AND coupon_id = ?', [req.userId, id]);
    if (userCoupon) return res.json(error('已领取该优惠券'));
    
    if (coupon.used_count >= coupon.total_count) return res.json(error('优惠券已领完'));
    
    await execute('INSERT INTO user_coupons (user_id, coupon_id) VALUES (?, ?)', [req.userId, id]);
    await execute('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [id]);
    
    res.json(success(null, '领取成功'));
  } catch (e) {
    res.json(error('领取失败'));
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, type, amount, min_amount, total_count, start_time, end_time } = req.body;
    if (!name || !amount) return res.json(error('参数错误'));
    
    const result = await execute('INSERT INTO coupons (name, type, amount, min_amount, total_count, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [name, type || 'discount', amount, min_amount || 0, total_count || 0, start_time, end_time]);
    
    const coupon = await queryOne('SELECT * FROM coupons WHERE id = ?', [result.lastID]);
    res.json(success(coupon, '创建成功'));
  } catch (e) {
    res.json(error('创建失败'));
  }
});

module.exports = router;