const express = require('express')
const db = require('../database/init')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/', (req, res) => {
  const { merchant_id, category_id, page = 1, pageSize = 20 } = req.query
  const offset = (page - 1) * pageSize
  
  let query = 'SELECT * FROM products WHERE status = ?'
  const params = ['active']
  
  if (merchant_id) {
    query += ' AND merchant_id = ?'
    params.push(merchant_id)
  }
  
  if (category_id) {
    query += ' AND category_id = ?'
    params.push(category_id)
  }
  
  query += ' ORDER BY id DESC LIMIT ? OFFSET ?'
  params.push(parseInt(pageSize), parseInt(offset))
  
  const products = db.prepare(query).all(...params)
  
  let countQuery = 'SELECT COUNT(*) as total FROM products WHERE status = ?'
  const countParams = ['active']
  
  if (merchant_id) {
    countQuery += ' AND merchant_id = ?'
    countParams.push(merchant_id)
  }
  
  const { total } = db.prepare(countQuery).get(...countParams)
  
  res.json({ list: products, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
  
  if (!product) {
    return res.status(404).json({ error: '商品不存在' })
  }
  
  res.json(product)
})

router.post('/', authMiddleware, (req, res) => {
  const { merchant_id, name, description, image, price, original_price, stock, category_id } = req.body
  
  if (!merchant_id || !name || !price) {
    return res.status(400).json({ error: '商户、商品名称和价格不能为空' })
  }

  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ? AND user_id = ?').get(merchant_id, req.user.id)
  if (!merchant && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限操作该商户' })
  }

  const result = db.prepare(`
    INSERT INTO products (merchant_id, name, description, image, price, original_price, stock, category_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(merchant_id, name, description, image, price, original_price, stock || 0, category_id)

  res.json({ id: result.lastInsertRowid })
})

module.exports = router
