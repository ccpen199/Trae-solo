const express = require('express')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')
const db = require('../database')

const router = express.Router()

router.post('/verification', authMiddleware, roleMiddleware('master'), (req, res) => {
  const { real_name, id_card, face_photo, id_card_front, id_card_back, skill_certificates, skills } = req.body

  const existing = db.prepare('SELECT id FROM master_verifications WHERE user_id = ?').get(req.user.id)
  
  if (existing) {
    db.prepare(`
      UPDATE master_verifications 
      SET real_name = ?, id_card = ?, face_photo = ?, id_card_front = ?, id_card_back = ?, skill_certificates = ?, skills = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(real_name, id_card, face_photo || '', id_card_front || '', id_card_back || '', skill_certificates || '', skills || '', req.user.id)
    res.json({ message: '认证信息已更新，等待审核' })
  } else {
    db.prepare(`
      INSERT INTO master_verifications (user_id, real_name, id_card, face_photo, id_card_front, id_card_back, skill_certificates, skills)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, real_name, id_card, face_photo || '', id_card_front || '', id_card_back || '', skill_certificates || '', skills || '')
    res.json({ message: '认证信息已提交，等待审核' })
  }
})

router.get('/verification', authMiddleware, roleMiddleware('master'), (req, res) => {
  const verification = db.prepare('SELECT * FROM master_verifications WHERE user_id = ?').get(req.user.id)
  res.json(verification || { status: 'unsubmitted' })
})

router.get('/profile', authMiddleware, roleMiddleware('master'), (req, res) => {
  const profile = db.prepare('SELECT * FROM master_profiles WHERE user_id = ?').get(req.user.id)
  const verification = db.prepare('SELECT * FROM master_verifications WHERE user_id = ?').get(req.user.id)
  res.json({ profile, verification })
})

router.get('/orders', authMiddleware, roleMiddleware('master'), (req, res) => {
  const { status } = req.query
  let sql = `
    SELECT o.*, u.name as owner_name, u.phone as owner_phone
    FROM orders o
    LEFT JOIN users u ON o.owner_id = u.id
    WHERE o.master_id = ?
  `
  const params = [req.user.id]
  
  if (status) {
    sql += ' AND o.status = ?'
    params.push(status)
  }
  
  sql += ' ORDER BY o.created_at DESC'
  
  const orders = db.prepare(sql).all(...params)
  res.json(orders)
})

router.post('/orders/:id/accept', authMiddleware, roleMiddleware('master'), (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND status = ?').get(req.params.id, 'negotiated')
  
  if (!order || order.master_id !== req.user.id) {
    return res.status(400).json({ message: '订单不存在或状态错误' })
  }
  
  db.prepare('UPDATE orders SET status = ?, accepted_at = CURRENT_TIMESTAMP WHERE id = ?').run('accepted', req.params.id)
  db.prepare('UPDATE master_profiles SET total_orders = total_orders + 1 WHERE user_id = ?').run(req.user.id)
  
  res.json({ message: '接单成功' })
})

router.post('/orders/:id/start', authMiddleware, roleMiddleware('master'), (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  
  if (!order || order.master_id !== req.user.id || order.status !== 'accepted') {
    return res.status(400).json({ message: '订单不存在或状态错误' })
  }
  
  db.prepare('UPDATE orders SET status = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?').run('in_progress', req.params.id)
  res.json({ message: '服务已开始' })
})

router.post('/orders/:id/complete', authMiddleware, roleMiddleware('master'), (req, res) => {
  const { photos } = req.body
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  
  if (!order || order.master_id !== req.user.id || order.status !== 'in_progress') {
    return res.status(400).json({ message: '订单不存在或状态错误' })
  }
  
  db.prepare('UPDATE orders SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', req.params.id)
  db.prepare('UPDATE master_profiles SET completed_orders = completed_orders + 1 WHERE user_id = ?').run(req.user.id)
  
  if (photos && photos.length > 0) {
    const insertPhoto = db.prepare('INSERT INTO order_photos (order_id, photo_type, photo_url, uploaded_by) VALUES (?, ?, ?, ?)')
    photos.forEach(photo => {
      insertPhoto.run(req.params.id, 'completion', photo, req.user.id)
    })
  }
  
  res.json({ message: '服务已完成，等待业主验收' })
})

router.get('/service-history', authMiddleware, roleMiddleware('master'), (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, 
           (SELECT COUNT(*) FROM reviews r WHERE r.order_id = o.id) as has_review,
           (SELECT rating FROM reviews r WHERE r.order_id = o.id) as rating,
           (SELECT COUNT(*) FROM rework_records rr WHERE rr.order_id = o.id) as rework_count
    FROM orders o
    WHERE o.master_id = ? AND o.status IN ('completed', 'accepted')
    ORDER BY o.created_at DESC
    LIMIT 50
  `).all(req.user.id)
  
  res.json(orders)
})

router.get('/statistics', authMiddleware, roleMiddleware('master'), (req, res) => {
  const profile = db.prepare('SELECT * FROM master_profiles WHERE user_id = ?').get(req.user.id)
  const reviews = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM reviews WHERE master_id = ?').get(req.user.id)
  
  res.json({
    profile,
    avg_rating: reviews.avg_rating || 5,
    total_reviews: reviews.total_reviews || 0
  })
})

module.exports = router
