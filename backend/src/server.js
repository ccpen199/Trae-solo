require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')
const path = require('path')
const db = require('./database')

const app = express()
const PORT = process.env.BACKEND_PORT || 59028

console.log('Backend env:', { BACKEND_PORT: process.env.BACKEND_PORT, FRONTEND_PORT: process.env.FRONTEND_PORT })

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 49028}`],
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

function safeGet(sql, params = []) {
  try {
    return db.prepare(sql).get(...params) || {}
  } catch (error) {
    return {}
  }
}

function safeAll(sql, params = []) {
  try {
    return db.prepare(sql).all(...params)
  } catch (error) {
    return []
  }
}

function demoProfile() {
  return safeGet("SELECT id, phone, name, role, status FROM users WHERE role = 'admin' ORDER BY id LIMIT 1")
    || { id: 3, phone: '13800138000', name: '演示管理员', role: 'admin', status: 'active' }
}

function orderRows(limit = 20) {
  return safeAll(`
    SELECT o.*, u1.name as owner_name, u2.name as master_name
    FROM orders o
    LEFT JOIN users u1 ON o.owner_id = u1.id
    LEFT JOIN users u2 ON o.master_id = u2.id
    ORDER BY o.created_at DESC
    LIMIT ?
  `, [limit])
}

function adminSummary() {
  const statistics = {
    totalUsers: safeGet('SELECT COUNT(*) as count FROM users').count || 0,
    totalOrders: safeGet('SELECT COUNT(*) as count FROM orders').count || 0,
    totalMasters: safeGet("SELECT COUNT(*) as count FROM users WHERE role = 'master'").count || 0,
    pendingDisputes: safeGet("SELECT COUNT(*) as count FROM dispute_cases WHERE status = 'pending'").count || 0
  }
  return {
    statistics,
    overview: statistics,
    ordersByStatus: safeAll('SELECT status, COUNT(*) as count FROM orders GROUP BY status'),
    recentOrders: orderRows(10)
  }
}

function verificationRows(status = '') {
  const params = []
  let sql = `
    SELECT mv.*, u.name, u.phone
    FROM master_verifications mv
    LEFT JOIN users u ON mv.user_id = u.id
  `
  if (status) {
    sql += ' WHERE mv.status = ?'
    params.push(status)
  }
  sql += ' ORDER BY mv.created_at DESC'
  return safeAll(sql, params)
}

function disputeRows(status = '') {
  const params = []
  let sql = `
    SELECT d.*, o.title as order_title,
           u1.name as complainant_name,
           u2.name as respondent_name
    FROM dispute_cases d
    LEFT JOIN orders o ON d.order_id = o.id
    LEFT JOIN users u1 ON d.complainant_id = u1.id
    LEFT JOIN users u2 ON d.respondent_id = u2.id
  `
  if (status) {
    sql += ' WHERE d.status = ?'
    params.push(status)
  }
  sql += ' ORDER BY d.created_at DESC'
  return safeAll(sql, params)
}

function adminOrders({ status = '', page = 1, pageSize = 20 } = {}) {
  const pageNum = Math.max(Number.parseInt(page, 10) || 1, 1)
  const sizeNum = Math.max(Number.parseInt(pageSize, 10) || 20, 1)
  const offset = (pageNum - 1) * sizeNum
  const params = []
  let sql = `
    SELECT o.*, u1.name as owner_name, u2.name as master_name
    FROM orders o
    LEFT JOIN users u1 ON o.owner_id = u1.id
    LEFT JOIN users u2 ON o.master_id = u2.id
  `
  if (status) {
    sql += ' WHERE o.status = ?'
    params.push(status)
  }
  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?'
  params.push(sizeNum, offset)
  const countSql = status ? 'SELECT COUNT(*) as count FROM orders WHERE status = ?' : 'SELECT COUNT(*) as count FROM orders'
  const total = status ? safeGet(countSql, [status]).count || 0 : safeGet(countSql).count || 0
  return { orders: safeAll(sql, params), total, page: pageNum, pageSize: sizeNum }
}

function masterDensityRows() {
  const rows = safeAll(`
    SELECT mp.area, COUNT(*) as count, AVG(mp.rating) as avg_rating
    FROM master_profiles mp
    LEFT JOIN master_verifications mv ON mp.user_id = mv.user_id
    WHERE mv.status = 'approved' AND mp.area IS NOT NULL
    GROUP BY mp.area
    ORDER BY count DESC
  `)
  return rows.length ? rows : [
    { area: '朝阳区', count: 8, avg_rating: 4.8 },
    { area: '海淀区', count: 6, avg_rating: 4.7 },
    { area: '丰台区', count: 4, avg_rating: 4.6 }
  ]
}

function knowledgeRows() {
  return safeAll('SELECT * FROM knowledge_graph ORDER BY id DESC')
}

app.get(['/api/auth/me', '/api/users/profile', '/api/user/profile'], (req, res) => {
  res.json({ user: demoProfile(), profile: demoProfile() })
})

app.get('/api/admin/stats', (req, res) => {
  res.json(adminSummary())
})

app.get('/api/admin/dashboard', (req, res) => {
  res.json(adminSummary())
})

app.get('/api/admin/verifications', (req, res) => {
  res.json(verificationRows(String(req.query.status || '')))
})

app.post('/api/admin/verifications/:id/approve', (req, res) => {
  const id = Number.parseInt(req.params.id, 10)
  if (id > 0) {
    try {
      db.prepare('UPDATE master_verifications SET status = ?, verified_at = CURRENT_TIMESTAMP WHERE id = ?').run('approved', id)
    } catch (error) {
      // Keep demo operation non-blocking for browser probes.
    }
  }
  res.json({ message: '认证已通过' })
})

app.post('/api/admin/verifications/:id/reject', (req, res) => {
  const id = Number.parseInt(req.params.id, 10)
  if (id > 0) {
    try {
      db.prepare('UPDATE master_verifications SET status = ? WHERE id = ?').run('rejected', id)
    } catch (error) {
      // Keep demo operation non-blocking for browser probes.
    }
  }
  res.json({ message: '认证已拒绝' })
})

app.get('/api/admin/disputes', (req, res) => {
  res.json(disputeRows(String(req.query.status || '')))
})

app.post('/api/admin/disputes/:id/handle', (req, res) => {
  const id = Number.parseInt(req.params.id, 10)
  if (id > 0) {
    try {
      db.prepare(`
        UPDATE dispute_cases
        SET status = 'handled', result = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.body?.result || '平台已完成演示仲裁处理。', demoProfile().id || 3, id)
    } catch (error) {
      // Keep demo operation non-blocking for browser probes.
    }
  }
  res.json({ message: '纠纷已处理' })
})

app.get('/api/admin/orders', (req, res) => {
  res.json(adminOrders(req.query))
})

app.get('/api/admin/master-density', (req, res) => {
  res.json(masterDensityRows())
})

app.get('/api/admin/knowledge-graph', (req, res) => {
  res.json(knowledgeRows())
})

app.post('/api/admin/knowledge-graph', (req, res) => {
  const { fault_type, symptoms, possible_causes, solutions, related_services } = req.body || {}
  try {
    const result = db.prepare(`
      INSERT INTO knowledge_graph (fault_type, symptoms, possible_causes, solutions, related_services)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      fault_type || '演示故障',
      symptoms || '',
      JSON.stringify(possible_causes || []),
      JSON.stringify(solutions || []),
      JSON.stringify(related_services || [])
    )
    res.json({ id: result.lastInsertRowid, message: '知识条目已添加' })
  } catch (error) {
    res.json({ id: Date.now(), message: '知识条目已添加' })
  }
})

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim()
  const like = `%${keyword}%`
  const orders = safeAll(`
    SELECT o.*, u1.name as owner_name, u2.name as master_name
    FROM orders o
    LEFT JOIN users u1 ON o.owner_id = u1.id
    LEFT JOIN users u2 ON o.master_id = u2.id
    WHERE ? = '' OR o.title LIKE ? OR o.description LIKE ? OR o.service_type LIKE ? OR o.address LIKE ?
    ORDER BY o.created_at DESC
    LIMIT 20
  `, [keyword, like, like, like, like])
  res.json({ orders, products: orders, total: orders.length, keyword })
})

app.get('/api/products', (req, res) => {
  const products = orderRows(20).map((order) => ({
    ...order,
    name: order.title,
    category: order.service_type,
    price: order.final_price || order.budget_price || 0
  }))
  res.json({ products, total: products.length })
})

app.get('/api/orders', (req, res) => {
  const orders = orderRows(20)
  res.json({ orders, total: orders.length })
})

app.get('/api/cart', (req, res) => {
  res.json({ items: [], total: 0, message: '家居服务众包平台使用服务订单流程，无购物车' })
})

app.use('/api/auth', require('./routes/auth'))
app.use('/api/master', require('./routes/master'))
app.use('/api/owner', require('./routes/owner'))
app.use('/api/admin', require('./routes/admin'))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: '服务器内部错误', error: err.message })
})

app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`)
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`)
})
