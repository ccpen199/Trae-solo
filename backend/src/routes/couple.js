const express = require('express')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')
const router = express.Router()

router.use(authMiddleware, roleMiddleware('couple'))

router.get('/profile', (req, res) => {
  const db = req.db
  const couple = db.prepare(`
    SELECT c.*, u.name, u.phone, u.avatar
    FROM couples c
    JOIN users u ON c.user_id = u.id
    WHERE c.user_id = ?
  `).get(req.user.id)
  
  if (couple) {
    couple.style_tags = couple.style_tags ? JSON.parse(couple.style_tags) : []
  }
  
  res.json(couple)
})

router.put('/profile', (req, res) => {
  const db = req.db
  const { partner_name, wedding_date, budget_total, style_tags, location } = req.body
  
  const existing = db.prepare('SELECT id FROM couples WHERE user_id = ?').get(req.user.id)
  
  if (existing) {
    db.prepare(`
      UPDATE couples 
      SET partner_name = ?, wedding_date = ?, budget_total = ?, style_tags = ?, location = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(partner_name, wedding_date, budget_total, JSON.stringify(style_tags || []), location, req.user.id)
  } else {
    db.prepare(`
      INSERT INTO couples (user_id, partner_name, wedding_date, budget_total, style_tags, location)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, partner_name, wedding_date, budget_total, JSON.stringify(style_tags || []), location)
  }
  
  const couple = db.prepare('SELECT * FROM couples WHERE user_id = ?').get(req.user.id)
  couple.style_tags = JSON.parse(couple.style_tags || '[]')
  res.json(couple)
})

router.get('/budget', (req, res) => {
  const db = req.db
  const couple = db.prepare('SELECT id FROM couples WHERE user_id = ?').get(req.user.id)
  
  if (!couple) {
    return res.json([])
  }
  
  const items = db.prepare('SELECT * FROM budget_items WHERE couple_id = ?').all(couple.id)
  res.json(items)
})

router.post('/budget', (req, res) => {
  const db = req.db
  const couple = db.prepare('SELECT id FROM couples WHERE user_id = ?').get(req.user.id)
  
  if (!couple) {
    return res.status(400).json({ message: '新人信息不存在' })
  }
  
  const { category, name, budget_amount, percentage } = req.body
  const result = db.prepare(`
    INSERT INTO budget_items (couple_id, category, name, budget_amount, percentage)
    VALUES (?, ?, ?, ?, ?)
  `).run(couple.id, category, name, budget_amount || 0, percentage || 0)
  
  res.json({ id: result.lastInsertRowid, message: '添加成功' })
})

router.put('/budget/:id', (req, res) => {
  const db = req.db
  const { category, name, budget_amount, actual_amount, percentage } = req.body
  
  db.prepare(`
    UPDATE budget_items 
    SET category = ?, name = ?, budget_amount = ?, actual_amount = ?, percentage = ?
    WHERE id = ?
  `).run(category, name, budget_amount, actual_amount || 0, percentage, req.params.id)
  
  res.json({ message: '更新成功' })
})

router.delete('/budget/:id', (req, res) => {
  const db = req.db
  db.prepare('DELETE FROM budget_items WHERE id = ?').run(req.params.id)
  res.json({ message: '删除成功' })
})

router.get('/timeline', (req, res) => {
  const db = req.db
  const couple = db.prepare('SELECT id FROM couples WHERE user_id = ?').get(req.user.id)
  
  if (!couple) {
    return res.json([])
  }
  
  const events = db.prepare('SELECT * FROM timeline_events WHERE couple_id = ? ORDER BY event_date').all(couple.id)
  res.json(events)
})

router.post('/timeline', (req, res) => {
  const db = req.db
  const couple = db.prepare('SELECT id FROM couples WHERE user_id = ?').get(req.user.id)
  
  if (!couple) {
    return res.status(400).json({ message: '新人信息不存在' })
  }
  
  const { title, description, event_date, category } = req.body
  
  const existing = db.prepare(`
    SELECT id FROM timeline_events 
    WHERE couple_id = ? AND DATE(event_date) = DATE(?) AND category = ?
  `).get(couple.id, event_date, category)
  
  if (existing) {
    return res.status(400).json({ message: '该日期已有同类事项，存在时间冲突' })
  }
  
  const result = db.prepare(`
    INSERT INTO timeline_events (couple_id, title, description, event_date, category)
    VALUES (?, ?, ?, ?, ?)
  `).run(couple.id, title, description, event_date, category)
  
  res.json({ id: result.lastInsertRowid, message: '添加成功' })
})

router.put('/timeline/:id', (req, res) => {
  const db = req.db
  const { is_completed } = req.body
  
  db.prepare('UPDATE timeline_events SET is_completed = ? WHERE id = ?').run(is_completed ? 1 : 0, req.params.id)
  res.json({ message: '更新成功' })
})

router.delete('/timeline/:id', (req, res) => {
  const db = req.db
  db.prepare('DELETE FROM timeline_events WHERE id = ?').run(req.params.id)
  res.json({ message: '删除成功' })
})

module.exports = router
