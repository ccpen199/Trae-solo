const express = require('express')
const db = require('../database/init')
const { authMiddleware, adminMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/', (req, res) => {
  const { business_domain, category_id, keyword, page = 1, pageSize = 10 } = req.query
  const offset = (page - 1) * pageSize
  
  let query = 'SELECT * FROM merchants WHERE status = ?'
  const params = ['approved']
  
  if (business_domain) {
    query += ' AND business_domain = ?'
    params.push(business_domain)
  }
  
  if (category_id) {
    query += ' AND category_id = ?'
    params.push(category_id)
  }

  if (keyword) {
    query += ' AND (name LIKE ? OR description LIKE ? OR address LIKE ?)'
    const keywordPattern = `%${keyword}%`
    params.push(keywordPattern, keywordPattern, keywordPattern)
  }
  
  query += ' ORDER BY id DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), parseInt(offset))
  
  const merchants = db.prepare(query).all(...params)
  
  let countQuery = 'SELECT COUNT(*) as total FROM merchants WHERE status = ?'
  const countParams = ['approved']
  
  if (business_domain) {
    countQuery += ' AND business_domain = ?'
    countParams.push(business_domain)
  }
  
  if (category_id) {
    countQuery += ' AND category_id = ?'
    countParams.push(category_id)
  }

  if (keyword) {
    countQuery += ' AND (name LIKE ? OR description LIKE ? OR address LIKE ?)'
    const keywordPattern = `%${keyword}%`
    countParams.push(keywordPattern, keywordPattern, keywordPattern)
  }
  
  const { total } = db.prepare(countQuery).get(...countParams)
  
  res.json({ list: merchants, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.get('/:id', (req, res) => {
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id)
  
  if (!merchant) {
    return res.status(404).json({ error: '商户不存在' })
  }
  
  const products = db.prepare('SELECT * FROM products WHERE merchant_id = ? AND status = ?').all(req.params.id, 'active')
  
  res.json({ ...merchant, products })
})

router.post('/', authMiddleware, (req, res) => {
  const { name, description, business_domain, category_id, address, phone, qualification } = req.body
  
  if (!name || !business_domain) {
    return res.status(400).json({ error: '商户名称和业务域不能为空' })
  }

  const result = db.prepare(`
    INSERT INTO merchants (user_id, name, description, business_domain, category_id, address, phone, qualification, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, name, description, business_domain, category_id, address, phone, qualification, 'pending')

  db.prepare('INSERT INTO audit_records (merchant_id, status, remark) VALUES (?, ?, ?)').run(
    result.lastInsertRowid, 'pending', '提交审核'
  )

  res.json({ id: result.lastInsertRowid, message: '商户已提交，等待审核' })
})

router.get('/admin/list', authMiddleware, adminMiddleware, (req, res) => {
  const { status, page = 1, pageSize = 10 } = req.query
  const offset = (page - 1) * pageSize
  
  let query = 'SELECT * FROM merchants'
  const params = []
  
  if (status) {
    query += ' WHERE status = ?'
    params.push(status)
  }
  
  query += ' ORDER BY id DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), parseInt(offset))
  
  const merchants = db.prepare(query).all(...params)
  
  const countQuery = status ? 'SELECT COUNT(*) as total FROM merchants WHERE status = ?' : 'SELECT COUNT(*) as total FROM merchants'
  const { total } = db.prepare(countQuery).get(...(status ? [status] : []))
  
  res.json({ list: merchants, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.post('/admin/audit/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { status, remark, ocr_result } = req.body
  
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id)
  if (!merchant) {
    return res.status(404).json({ error: '商户不存在' })
  }

  db.prepare('UPDATE merchants SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id)
  
  db.prepare('INSERT INTO audit_records (merchant_id, auditor_id, status, remark, ocr_result) VALUES (?, ?, ?, ?, ?)').run(
    req.params.id, req.user.id, status, remark, JSON.stringify(ocr_result || {})
  )

  res.json({ message: '审核完成' })
})

module.exports = router
