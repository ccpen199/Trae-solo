const express = require('express')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')
const router = express.Router()

router.get('/', (req, res) => {
  const db = req.db
  const { type, category, keyword, min_price, max_price, location, sort } = req.query
  
  let sql = `
    SELECT s.*, m.company_name, m.address, m.rating, m.review_count,
           m.latitude, m.longitude
    FROM services s
    JOIN merchants m ON s.merchant_id = m.id
    WHERE s.status = 'active'
  `
  const params = []
  
  if (type) {
    sql += ' AND s.type = ?'
    params.push(type)
  }
  
  if (keyword) {
    sql += ' AND (s.name LIKE ? OR s.description LIKE ? OR m.company_name LIKE ?)'
    const kw = `%${keyword}%`
    params.push(kw, kw, kw)
  }
  
  if (min_price) {
    sql += ' AND s.price >= ?'
    params.push(min_price)
  }
  
  if (max_price) {
    sql += ' AND s.price <= ?'
    params.push(max_price)
  }
  
  if (sort === 'price_asc') sql += ' ORDER BY s.price ASC'
  else if (sort === 'price_desc') sql += ' ORDER BY s.price DESC'
  else if (sort === 'rating') sql += ' ORDER BY m.rating DESC'
  else sql += ' ORDER BY s.created_at DESC'
  
  const services = db.prepare(sql).all(...params)
  
  services.forEach(s => {
    s.images = s.images ? JSON.parse(s.images) : []
  })
  
  if (location) {
    services.forEach(s => {
      s.match_score = calculateMatchScore(s, req.query)
    })
    services.sort((a, b) => b.match_score - a.match_score)
  }
  
  res.json(services)
})

function calculateMatchScore(service, query) {
  let score = 0
  
  if (query.budget && service.price) {
    const budget = parseFloat(query.budget)
    const price = service.price
    if (price <= budget) score += 25
    else if (price <= budget * 1.2) score += 15
  }
  
  if (service.rating) {
    score += service.rating * 5
  }
  
  if (query.distance && service.distance) {
    const distance = parseFloat(query.distance)
    if (service.distance <= distance) score += 25
    else if (service.distance <= distance * 2) score += 15
  }
  
  return Math.min(score, 100)
}

router.get('/:id', (req, res) => {
  const db = req.db
  const service = db.prepare(`
    SELECT s.*, m.company_name, m.address, m.rating, m.review_count,
           m.description as merchant_description
    FROM services s
    JOIN merchants m ON s.merchant_id = m.id
    WHERE s.id = ?
  `).get(req.params.id)
  
  if (!service) {
    return res.status(404).json({ message: '服务不存在' })
  }
  
  service.images = service.images ? JSON.parse(service.images) : []
  
  res.json(service)
})

router.post('/', authMiddleware, roleMiddleware('merchant'), (req, res) => {
  const db = req.db
  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
  
  if (!merchant) {
    return res.status(400).json({ message: '商家信息不存在' })
  }
  
  const { type, name, description, price, original_price, images, cover_image,
          photoshoot_photos, photoshoot_retouched, photoshoot_delivery_days,
          banquet_capacity, banquet_3d_url, banquet_deposit, banquet_deposit_rules } = req.body
  
  const result = db.prepare(`
    INSERT INTO services (merchant_id, type, name, description, price, original_price, images, cover_image,
                          photoshoot_photos, photoshoot_retouched, photoshoot_delivery_days,
                          banquet_capacity, banquet_3d_url, banquet_deposit, banquet_deposit_rules)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(merchant.id, type, name, description, price, original_price, JSON.stringify(images || []), cover_image,
         photoshoot_photos, photoshoot_retouched, photoshoot_delivery_days,
         banquet_capacity, banquet_3d_url, banquet_deposit, banquet_deposit_rules)
  
  res.json({ id: result.lastInsertRowid, message: '添加成功' })
})

router.put('/:id', authMiddleware, roleMiddleware('merchant'), (req, res) => {
  const db = req.db
  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
  
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id)
  if (!service || service.merchant_id !== merchant.id) {
    return res.status(403).json({ message: '无权修改此服务' })
  }
  
  const { name, description, price, original_price, images, cover_image, status } = req.body
  
  db.prepare(`
    UPDATE services SET name = ?, description = ?, price = ?, original_price = ?, images = ?, cover_image = ?, status = ?
    WHERE id = ?
  `).run(name, description, price, original_price, JSON.stringify(images || []), cover_image, status || 'active', req.params.id)
  
  res.json({ message: '更新成功' })
})

router.delete('/:id', authMiddleware, roleMiddleware('merchant'), (req, res) => {
  const db = req.db
  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id)
  
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id)
  if (!service || service.merchant_id !== merchant.id) {
    return res.status(403).json({ message: '无权删除此服务' })
  }
  
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id)
  res.json({ message: '删除成功' })
})

module.exports = router
