const express = require('express')
const db = require('../database/init')
const { authMiddleware, adminMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/', (req, res) => {
  const { business_domain, merchant_id } = req.query
  
  let query = 'SELECT * FROM coupons WHERE status = ? AND (total_count = 0 OR used_count < total_count)'
  const params = ['active']
  
  if (business_domain) {
    query += ' AND business_domain = ?'
    params.push(business_domain)
  }
  
  if (merchant_id) {
    query += ' AND merchant_id = ?'
    params.push(merchant_id)
  }
  
  query += ' ORDER BY id DESC'
  
  const coupons = db.prepare(query).all(...params)
  res.json(coupons)
})

router.get('/my', authMiddleware, (req, res) => {
  const { status = 'unused' } = req.query
  
  const coupons = db.prepare(`
    SELECT uc.*, c.name, c.type, c.value, c.min_amount, c.business_domain, c.merchant_id
    FROM user_coupons uc
    JOIN coupons c ON uc.coupon_id = c.id
    WHERE uc.user_id = ? AND uc.status = ?
    ORDER BY uc.id DESC
  `).all(req.user.id, status)
  
  res.json(coupons)
})

router.post('/:id/receive', authMiddleware, (req, res) => {
  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ? AND status = ?').get(req.params.id, 'active')
  
  if (!coupon) {
    return res.status(404).json({ error: '优惠券不存在或已失效' })
  }

  if (coupon.total_count > 0 && coupon.used_count >= coupon.total_count) {
    return res.status(400).json({ error: '优惠券已领完' })
  }

  const received = db.prepare('SELECT id FROM user_coupons WHERE user_id = ? AND coupon_id = ?').get(req.user.id, req.params.id)
  if (received) {
    return res.status(400).json({ error: '已领取过该优惠券' })
  }

  db.prepare('INSERT INTO user_coupons (user_id, coupon_id) VALUES (?, ?)').run(req.user.id, req.params.id)
  
  db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(req.params.id)

  res.json({ message: '领取成功' })
})

router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  const { name, type, value, min_amount, business_domain, merchant_id, total_count, start_time, end_time } = req.body
  
  if (!name || !type || !value) {
    return res.status(400).json({ error: '名称、类型和面值不能为空' })
  }

  const result = db.prepare(`
    INSERT INTO coupons (name, type, value, min_amount, business_domain, merchant_id, total_count, start_time, end_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, type, value, min_amount || 0, business_domain, merchant_id, total_count || 0, start_time, end_time)

  res.json({ id: result.lastInsertRowid })
})

module.exports = router
