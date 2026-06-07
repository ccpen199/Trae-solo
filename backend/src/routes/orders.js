const express = require('express')
const db = require('../config/database')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.post('/', authMiddleware, (req, res) => {
  const { session_id, seats, order_no, coupon_id } = req.body
  const session = db.prepare('SELECT * FROM movie_sessions WHERE id = ?').get(session_id)
  
  if (!session) return res.status(404).json({ error: '场次不存在' })
  
  const lock = db.prepare(`
    SELECT * FROM seat_locks 
    WHERE order_no = ? AND session_id = ? AND user_id = ? AND status = 1
  `).get(order_no, session_id, req.user.id)
  
  if (!lock) return res.status(400).json({ error: '座位锁定已过期' })
  
  const seatsArr = JSON.parse(seats)
  const totalAmount = session.base_price * seatsArr.length
  let payAmount = totalAmount
  
  if (coupon_id) {
    const userCoupon = db.prepare('SELECT * FROM user_coupons WHERE id = ? AND user_id = ? AND status = 0').get(coupon_id, req.user.id)
    if (userCoupon) {
      const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(userCoupon.coupon_id)
      if (coupon && totalAmount >= coupon.min_amount) {
        payAmount = Math.max(0, totalAmount - coupon.value)
      }
    }
  }
  
  const verifyCode = Math.random().toString(36).substr(2, 8).toUpperCase()
  
  const result = db.prepare(`
    INSERT INTO orders (order_no, user_id, session_id, seats, seats_snapshot, total_amount, pay_amount, verify_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(order_no, req.user.id, session_id, seats, seats, totalAmount, payAmount, verifyCode)
  
  db.prepare('UPDATE seat_locks SET status = 0 WHERE order_no = ?').run(order_no)
  
  if (coupon_id) {
    db.prepare('UPDATE user_coupons SET status = 1, used_at = datetime("now") WHERE id = ?').run(coupon_id)
  }
  
  res.json({
    id: result.lastInsertRowid,
    order_no,
    total_amount: totalAmount,
    pay_amount: payAmount,
    verify_code: verifyCode
  })
})

router.get('/:id', authMiddleware, (req, res) => {
  const order = db.prepare(`
    SELECT o.*, m.title, m.poster, s.start_time, c.name as cinema_name, h.name as hall_name
    FROM orders o
    JOIN movie_sessions s ON o.session_id = s.id
    JOIN movies m ON s.movie_id = m.id
    JOIN cinemas c ON s.cinema_id = c.id
    JOIN halls h ON s.hall_id = h.id
    WHERE o.id = ? AND o.user_id = ?
  `).get(req.params.id, req.user.id)
  
  if (!order) return res.status(404).json({ error: '订单不存在' })
  res.json(order)
})

router.post('/:id/pay', authMiddleware, (req, res) => {
  const order = db.prepare(`
    SELECT * FROM orders
    WHERE (id = ? OR order_no = ?) AND user_id = ?
  `).get(req.params.id, req.params.id, req.user.id)
  
  if (!order) return res.status(404).json({ error: '订单不存在' })
  if (order.pay_status === 1) return res.status(400).json({ error: '订单已支付' })
  
  db.prepare(`
    UPDATE orders SET pay_status = 1, pay_time = datetime("now") WHERE id = ?
  `).run(order.id)
  
  res.json({ success: true })
})

module.exports = router
