const express = require('express')
const db = require('../database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

router.get('/categories', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM categories ORDER BY sort_order').all()
    res.json({ success: true, data: rows })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/products', (req, res) => {
  const { page = 1, limit = 10, category_id } = req.query
  const offset = (page - 1) * limit

  let query = 'SELECT * FROM products'
  let params = []

  if (category_id) {
    query += ' WHERE category_id = ?'
    params.push(category_id)
  }

  query += ' ORDER BY sales DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), parseInt(offset))

  try {
    const rows = db.prepare(query).all(params)
    rows.forEach(row => {
      row.images = JSON.parse(row.images || '[]')
      row.specs = JSON.parse(row.specs || '[]')
    })
    res.json({ success: true, data: rows })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/products/:id', (req, res) => {
  const { id } = req.params

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id)

    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }

    product.images = JSON.parse(product.images || '[]')
    product.specs = JSON.parse(product.specs || '[]')
    product.store = db.prepare('SELECT * FROM stores WHERE id = ?').get(product.store_id)
    product.reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ?').all(id)
    product.questions = db.prepare('SELECT * FROM questions WHERE product_id = ?').all(id)

    res.json({ success: true, data: product })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/products/search', (req, res) => {
  const { keyword, page = 1, limit = 10 } = req.query
  const offset = (page - 1) * limit

  if (!keyword) {
    return res.status(400).json({ success: false, message: '请输入搜索关键词' })
  }

  try {
    const rows = db.prepare(
      'SELECT * FROM products WHERE name LIKE ? ORDER BY sales DESC LIMIT ? OFFSET ?'
    ).all([`%${keyword}%`, parseInt(limit), parseInt(offset)])

    rows.forEach(row => {
      row.images = JSON.parse(row.images || '[]')
      row.specs = JSON.parse(row.specs || '[]')
    })

    res.json({ success: true, data: rows })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/products/:id/reviews', authenticateToken, (req, res) => {
  const { id } = req.params
  const { rating, content } = req.body
  const user_id = req.user.id

  if (!rating || !content) {
    return res.status(400).json({ success: false, message: '请填写评分和评价内容' })
  }

  try {
    const result = db.prepare(
      'INSERT INTO reviews (product_id, user_id, rating, content) VALUES (?, ?, ?, ?)'
    ).run(id, user_id, rating, content)
    res.json({ success: true, message: '评价成功', data: { id: result.lastInsertRowid } })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/products/:id/questions', authenticateToken, (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const user_id = req.user.id

  if (!content) {
    return res.status(400).json({ success: false, message: '请填写问题内容' })
  }

  try {
    const result = db.prepare(
      'INSERT INTO questions (product_id, user_id, content) VALUES (?, ?, ?)'
    ).run(id, user_id, content)
    res.json({ success: true, message: '提问成功', data: { id: result.lastInsertRowid } })
  } catch (err) {
    return res.status(500).json({ success: false, message: '服务器错误' })
  }
})

module.exports = router