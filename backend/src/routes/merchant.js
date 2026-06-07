const express = require('express')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')
const router = express.Router()

router.use(authMiddleware, roleMiddleware('merchant'))

router.get('/profile', (req, res) => {
  const db = req.db
  const merchant = db.prepare(`
    SELECT m.*, u.name, u.phone, u.avatar
    FROM merchants m
    JOIN users u ON m.user_id = u.id
    WHERE m.user_id = ?
  `).get(req.user.id)
  
  res.json(merchant)
})

router.put('/profile', (req, res) => {
  const db = req.db
  const { company_name, category, address, description, phone, certification_files, business_license } = req.body
  
  db.prepare(`
    UPDATE merchants 
    SET company_name = ?, category = ?, address = ?, description = ?, phone = ?, 
        certification_files = ?, business_license = ?, certification_status = 'pending',
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(company_name, category, address, description, phone, certification_files, business_license, req.user.id)
  
  res.json({ message: '更新成功，认证信息待审核' })
})

router.get('/cases', (req, res) => {
  const db = req.db
  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
  
  if (!merchant) {
    return res.json([])
  }
  
  const cases = db.prepare('SELECT * FROM merchant_cases WHERE merchant_id = ? ORDER BY created_at DESC').all(merchant.id)
  cases.forEach(c => {
    c.images = c.images ? JSON.parse(c.images) : []
    c.style_tags = c.style_tags ? JSON.parse(c.style_tags) : []
  })
  
  res.json(cases)
})

router.post('/cases', (req, res) => {
  const db = req.db
  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
  
  if (!merchant) {
    return res.status(400).json({ message: '商家信息不存在' })
  }
  
  const { title, description, images, cover_image, style_tags, price } = req.body
  
  const result = db.prepare(`
    INSERT INTO merchant_cases (merchant_id, title, description, images, cover_image, style_tags, price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(merchant.id, title, description, JSON.stringify(images || []), cover_image, JSON.stringify(style_tags || []), price)
  
  res.json({ id: result.lastInsertRowid, message: '添加成功' })
})

router.delete('/cases/:id', (req, res) => {
  const db = req.db
  db.prepare('DELETE FROM merchant_cases WHERE id = ?').run(req.params.id)
  res.json({ message: '删除成功' })
})

router.get('/schedules', (req, res) => {
  const db = req.db
  const { start_date, end_date } = req.query
  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
  
  if (!merchant) {
    return res.json([])
  }
  
  let sql = 'SELECT * FROM schedules WHERE merchant_id = ?'
  const params = [merchant.id]
  
  if (start_date && end_date) {
    sql += ' AND date BETWEEN ? AND ?'
    params.push(start_date, end_date)
  }
  
  sql += ' ORDER BY date'
  
  const schedules = db.prepare(sql).all(...params)
  schedules.forEach(s => {
    s.time_slots = s.time_slots ? JSON.parse(s.time_slots) : []
  })
  
  res.json(schedules)
})

router.post('/schedules', (req, res) => {
  const db = req.db
  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
  
  if (!merchant) {
    return res.status(400).json({ message: '商家信息不存在' })
  }
  
  const { date, time_slots } = req.body
  
  try {
    const result = db.prepare(`
      INSERT INTO schedules (merchant_id, date, time_slots)
      VALUES (?, ?, ?)
    `).run(merchant.id, date, JSON.stringify(time_slots || []))
    
    res.json({ id: result.lastInsertRowid, message: '添加成功' })
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ message: '该日期档期已存在' })
    }
    throw err
  }
})

router.put('/schedules/:id', (req, res) => {
  const db = req.db
  const { time_slots, is_booked } = req.body
  
  db.prepare(`
    UPDATE schedules SET time_slots = ?, is_booked = ? WHERE id = ?
  `).run(JSON.stringify(time_slots || []), is_booked ? 1 : 0, req.params.id)
  
  res.json({ message: '更新成功' })
})

router.delete('/schedules/:id', (req, res) => {
  const db = req.db
  db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id)
  res.json({ message: '删除成功' })
})

router.get('/reviews', (req, res) => {
  const db = req.db
  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
  
  if (!merchant) {
    return res.json([])
  }
  
  const reviews = db.prepare(`
    SELECT r.*, u.name as couple_name
    FROM reviews r
    JOIN couples c ON r.couple_id = c.id
    JOIN users u ON c.user_id = u.id
    WHERE r.merchant_id = ?
    ORDER BY r.created_at DESC
  `).all(merchant.id)
  
  reviews.forEach(r => {
    r.images = r.images ? JSON.parse(r.images) : []
  })
  
  res.json(reviews)
})

router.post('/reviews/:id/reply', (req, res) => {
  const db = req.db
  const { merchant_reply } = req.body
  
  db.prepare(`
    UPDATE reviews SET merchant_reply = ?, replied_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(merchant_reply, req.params.id)
  
  res.json({ message: '回复成功' })
})

router.get('/dashboard', (req, res) => {
  const db = req.db
  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
  
  if (!merchant) {
    return res.json({ total_orders: 0, pending_orders: 0, total_revenue: 0, avg_rating: 5 })
  }
  
  const orders = db.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN status = 'pending' OR status = 'confirmed' THEN 1 ELSE 0 END) as pending_orders,
      SUM(total_amount) as total_revenue
    FROM orders WHERE merchant_id = ?
  `).get(merchant.id)
  
  const rating = db.prepare('SELECT AVG(rating) as avg_rating FROM reviews WHERE merchant_id = ?').get(merchant.id)
  
  res.json({
    total_orders: orders.total_orders || 0,
    pending_orders: orders.pending_orders || 0,
    total_revenue: orders.total_revenue || 0,
    avg_rating: rating.avg_rating || 5
  })
})

router.get('/stats', (req, res) => {
  const db = req.db
  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
  
  if (!merchant) {
    return res.json({ total_orders: 0, pending_orders: 0, total_revenue: 0, avg_rating: 5 })
  }
  
  const orders = db.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN status = 'pending' OR status = 'confirmed' THEN 1 ELSE 0 END) as pending_orders,
      SUM(total_amount) as total_revenue
    FROM orders WHERE merchant_id = ?
  `).get(merchant.id)
  
  const rating = db.prepare('SELECT AVG(rating) as avg_rating FROM reviews WHERE merchant_id = ?').get(merchant.id)
  
  res.json({
    total_orders: orders.total_orders || 0,
    pending_orders: orders.pending_orders || 0,
    total_revenue: orders.total_revenue || 0,
    avg_rating: rating.avg_rating || 5
  })
})

module.exports = router
