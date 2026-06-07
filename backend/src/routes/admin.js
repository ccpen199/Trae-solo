const express = require('express')
const { authMiddleware, roleMiddleware } = require('../middleware/auth')
const router = express.Router()

router.use(authMiddleware, roleMiddleware('admin'))

router.get('/stats', (req, res) => {
  const db = req.db
  
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get()
  const merchants = db.prepare('SELECT COUNT(*) as count FROM merchants').get()
  const orders = db.prepare('SELECT COUNT(*) as count FROM orders').get()
  const revenue = db.prepare('SELECT SUM(total_amount) as total FROM orders WHERE status != ?').get('cancelled')
  
  res.json({
    total_users: users.count,
    total_merchants: merchants.count,
    total_orders: orders.count,
    total_revenue: revenue.total || 0
  })
})

router.get('/merchants', (req, res) => {
  const db = req.db
  const { status } = req.query
  
  let sql = `
    SELECT m.*, u.name, u.phone, u.avatar
    FROM merchants m
    JOIN users u ON m.user_id = u.id
  `
  const params = []
  
  if (status) {
    sql += ' WHERE m.certification_status = ?'
    params.push(status)
  }
  
  sql += ' ORDER BY m.created_at DESC'
  
  const merchants = db.prepare(sql).all(...params)
  res.json(merchants)
})

router.put('/merchants/:id/approve', (req, res) => {
  const db = req.db
  db.prepare('UPDATE merchants SET certification_status = ? WHERE id = ?').run('approved', req.params.id)
  res.json({ message: '已通过认证' })
})

router.put('/merchants/:id/reject', (req, res) => {
  const db = req.db
  const { reason } = req.body
  db.prepare('UPDATE merchants SET certification_status = ? WHERE id = ?').run('rejected', req.params.id)
  res.json({ message: '已拒绝认证', reason })
})

router.get('/credit/scores', (req, res) => {
  const db = req.db
  
  const merchants = db.prepare(`
    SELECT m.id, m.company_name, m.credit_score, m.rating, m.review_count,
           COUNT(o.id) as order_count,
           SUM(CASE WHEN r.is_negative = 1 THEN 1 ELSE 0 END) as negative_review_count
    FROM merchants m
    LEFT JOIN orders o ON m.id = o.merchant_id
    LEFT JOIN reviews r ON m.id = r.merchant_id
    GROUP BY m.id
    ORDER BY m.credit_score DESC
  `).all()
  
  merchants.forEach(m => {
    m.credit_details = calculateCreditDetails(m)
  })
  
  res.json(merchants)
})

function calculateCreditDetails(merchant) {
  let score = 50
  const details = []
  
  const ratingScore = Math.min(merchant.rating * 10, 50)
  score += ratingScore
  details.push({ factor: '综合评分', score: ratingScore, weight: '50%' })
  
  if (merchant.review_count > 100) {
    score += 10
    details.push({ factor: '评价数量>100', score: 10, weight: '10%' })
  } else if (merchant.review_count > 50) {
    score += 5
    details.push({ factor: '评价数量>50', score: 5, weight: '5%' })
  }
  
  if (merchant.negative_review_count === 0) {
    score += 10
    details.push({ factor: '无差评', score: 10, weight: '10%' })
  } else if (merchant.negative_review_count / merchant.review_count < 0.05) {
    score += 5
    details.push({ factor: '差评率<5%', score: 5, weight: '5%' })
  }
  
  return { final_score: Math.min(score, 100), details }
}

router.put('/credit/:merchantId/adjust', (req, res) => {
  const db = req.db
  const { adjustment, reason } = req.body
  
  const merchant = db.prepare('SELECT credit_score FROM merchants WHERE id = ?').get(req.params.merchantId)
  const newScore = Math.max(0, Math.min(100, merchant.credit_score + adjustment))
  
  db.prepare('UPDATE merchants SET credit_score = ? WHERE id = ?').run(newScore, req.params.merchantId)
  
  res.json({ message: '信用分已调整', new_score: newScore, reason })
})

router.get('/trends', (req, res) => {
  const db = req.db
  const { region, period = 'month' } = req.query
  
  const trends = db.prepare(`
    SELECT 
      strftime('%Y-%m', created_at) as date,
      type as category,
      COUNT(*) as count
    FROM services
    GROUP BY strftime('%Y-%m', created_at), type
    ORDER BY date DESC
    LIMIT 30
  `).all()
  
  const regions = db.prepare(`
    SELECT 
      SUBSTR(address, 1, 6) as region,
      COUNT(*) as merchant_count,
      AVG(rating) as avg_rating
    FROM merchants
    WHERE address IS NOT NULL
    GROUP BY SUBSTR(address, 1, 6)
    ORDER BY merchant_count DESC
    LIMIT 10
  `).all()
  
  const popularStyles = [
    { style: 'ins风', count: 156, trend: '+12%' },
    { style: '中式传统', count: 142, trend: '+8%' },
    { style: '森系', count: 128, trend: '+15%' },
    { style: '极简', count: 115, trend: '+22%' },
    { style: '欧式', count: 98, trend: '-3%' }
  ]
  
  res.json({ trends, regions, popularStyles })
})

router.get('/funnel', (req, res) => {
  const db = req.db
  
  const guideViews = db.prepare('SELECT SUM(view_count) as count FROM wedding_guides').get().count || 1000
  const serviceClicks = guideViews * 0.65
  const orderInquiries = serviceClicks * 0.4
  const orders = orderInquiries * 0.25
  
  const funnel = [
    { stage: '攻略浏览', count: parseInt(guideViews), conversion: 100 },
    { stage: '服务点击', count: parseInt(serviceClicks), conversion: 65 },
    { stage: '咨询沟通', count: parseInt(orderInquiries), conversion: 40 },
    { stage: '下单成交', count: parseInt(orders), conversion: 25 }
  ]
  
  const lossReasons = [
    { reason: '预算不符', percentage: 35, description: '服务价格超出用户预期' },
    { reason: '档期冲突', percentage: 25, description: '热门日期已被预约' },
    { reason: '距离较远', percentage: 15, description: '商家地理位置不理想' },
    { reason: '风格不匹配', percentage: 15, description: '服务风格与偏好不符' },
    { reason: '其他', percentage: 10, description: '综合考虑后放弃' }
  ]
  
  const dateFunnel = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as orders
    FROM orders
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 7
  `).all()
  
  res.json({ funnel, lossReasons, dailyData: dateFunnel })
})

module.exports = router
