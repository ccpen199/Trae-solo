const express = require('express')
const router = express.Router()
const db = require('../models/database')

router.get('/categories', async (req, res) => {
  try {
    const categories = await db.query('SELECT * FROM categories ORDER BY sort_order')
    res.json({ code: 200, data: categories })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.get('/hot', async (req, res) => {
  try {
    const products = await db.query('SELECT * FROM products WHERE is_hot = 1 ORDER BY sales DESC LIMIT 10')
    res.json({ code: 200, data: products })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.get('/new', async (req, res) => {
  try {
    const products = await db.query('SELECT * FROM products WHERE is_new = 1 ORDER BY created_at DESC LIMIT 10')
    res.json({ code: 200, data: products })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.get('/search/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params
    const product = await db.get('SELECT * FROM products WHERE barcode = ?', [barcode])
    
    if (!product) {
      return res.status(404).json({ code: 404, message: '未找到该商品' })
    }
    
    res.json({ code: 200, data: product })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.get('/search/hotwords', async (req, res) => {
  try {
    const hotwords = ['有机蔬菜', '新鲜水果', '进口牛奶', '土鸡蛋', '海鲜水产', '坚果零食']
    res.json({ code: 200, data: hotwords })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.get('/', async (req, res) => {
  try {
    const { 
      keyword, 
      categoryId, 
      sort = 'sales', 
      page = 1, 
      limit = 10,
      minPrice,
      maxPrice,
      isNew,
      isHot
    } = req.query
    
    let sql = 'SELECT * FROM products WHERE 1=1'
    let params = []
    
    if (keyword) {
      sql += ' AND (name LIKE ? OR description LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    if (categoryId) {
      sql += ' AND category_id = ?'
      params.push(categoryId)
    }
    
    if (minPrice) {
      sql += ' AND price >= ?'
      params.push(minPrice)
    }
    
    if (maxPrice) {
      sql += ' AND price <= ?'
      params.push(maxPrice)
    }
    
    if (isNew === '1') {
      sql += ' AND is_new = 1'
    }
    
    if (isHot === '1') {
      sql += ' AND is_hot = 1'
    }
    
    const sortMap = {
      sales: 'sales DESC',
      price_asc: 'price ASC',
      price_desc: 'price DESC',
      newest: 'created_at DESC'
    }
    sql += ` ORDER BY ${sortMap[sort] || sortMap.sales}`
    
    const offset = (page - 1) * limit
    sql += ' LIMIT ? OFFSET ?'
    params.push(parseInt(limit), offset)
    
    const products = await db.query(sql, params)
    
    const countSql = sql.replace(/ORDER BY.*/, '').replace(/LIMIT.*/, '')
    const count = await db.get('SELECT COUNT(*) as total FROM (' + countSql + ') as t', params.slice(0, -2))
    
    res.json({ 
      code: 200, 
      data: { 
        list: products, 
        pagination: { total: count.total, page: parseInt(page), limit: parseInt(limit) } 
      }
    })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const product = await db.get('SELECT * FROM products WHERE id = ?', [id])
    
    if (!product) {
      return res.status(404).json({ code: 404, message: '商品不存在' })
    }
    
    res.json({ code: 200, data: product })
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
})

module.exports = router