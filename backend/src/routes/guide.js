const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  const db = req.db
  const { stage } = req.query
  
  let sql = 'SELECT * FROM wedding_guides'
  const params = []
  
  if (stage) {
    sql += ' WHERE stage = ?'
    params.push(stage)
  }
  
  sql += ' ORDER BY sort_order, created_at DESC'
  
  const guides = db.prepare(sql).all(...params)
  
  guides.forEach(g => {
    g.check_points = g.check_points ? JSON.parse(g.check_points) : []
    g.risk_tips = g.risk_tips ? JSON.parse(g.risk_tips) : []
    g.related_merchant_ids = g.related_merchant_ids ? JSON.parse(g.related_merchant_ids) : []
  })
  
  res.json(guides)
})

router.get('/:id', (req, res) => {
  const db = req.db
  const guide = db.prepare('SELECT * FROM wedding_guides WHERE id = ?').get(req.params.id)
  
  if (!guide) {
    return res.status(404).json({ message: '攻略不存在' })
  }
  
  db.prepare('UPDATE wedding_guides SET view_count = view_count + 1 WHERE id = ?').run(req.params.id)
  
  guide.check_points = guide.check_points ? JSON.parse(guide.check_points) : []
  guide.risk_tips = guide.risk_tips ? JSON.parse(guide.risk_tips) : []
  guide.related_merchant_ids = guide.related_merchant_ids ? JSON.parse(guide.related_merchant_ids) : []
  
  if (guide.related_merchant_ids.length > 0) {
    const placeholders = guide.related_merchant_ids.map(() => '?').join(',')
    guide.related_merchants = db.prepare(`
      SELECT m.id, m.company_name, m.category, m.rating, m.review_count, m.address
      FROM merchants m
      WHERE m.id IN (${placeholders})
    `).all(...guide.related_merchant_ids)
  }
  
  res.json(guide)
})

module.exports = router
