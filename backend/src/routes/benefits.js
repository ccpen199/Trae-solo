const express = require('express')
const db = require('../config/database')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/packages', (req, res) => {
  const packages = db.prepare('SELECT * FROM benefit_packages WHERE status = 1').all()
  res.json(packages)
})

router.post('/packages/:id/buy', authMiddleware, (req, res) => {
  const pkg = db.prepare('SELECT * FROM benefit_packages WHERE id = ? AND status = 1').get(req.params.id)
  if (!pkg) return res.status(404).json({ error: '权益包不存在' })
  
  db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(pkg.points_bonus, req.user.id)
  
  if (pkg.coupons) {
    const couponIds = JSON.parse(pkg.coupons)
    couponIds.forEach(cid => {
      db.prepare('INSERT INTO user_coupons (user_id, coupon_id) VALUES (?, ?)').run(req.user.id, cid)
    })
  }
  
  res.json({ success: true, points_added: pkg.points_bonus })
})

router.get('/points', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user.id)
  res.json({ points: user?.points || 0 })
})

module.exports = router
