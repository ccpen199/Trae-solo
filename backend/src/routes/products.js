const express = require('express')
const router = express.Router()
const db = require('../database')
const { authenticateToken, checkPermission } = require('../middleware/auth')
const { v4: uuidv4 } = require('uuid')
const { body, validationResult, query } = require('express-validator')

router.use(authenticateToken)

router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
], (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { page = 1, pageSize = 10, keyword, categoryId, brandId, supplierId, status } = req.query
    const offset = (page - 1) * pageSize

    let whereClause = '1=1'
    const params = []

    if (keyword) {
      whereClause += ' AND (p.name LIKE ? OR p.code LIKE ? OR p.keywords LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (categoryId) {
      whereClause += ' AND p.category_id = ?'
      params.push(categoryId)
    }
    if (brandId) {
      whereClause += ' AND p.brand_id = ?'
      params.push(brandId)
    }
    if (supplierId) {
      whereClause += ' AND p.supplier_id = ?'
      params.push(supplierId)
    }
    if (status !== undefined && status !== '') {
      whereClause += ' AND p.status = ?'
      params.push(parseInt(status))
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM products p WHERE ${whereClause}
    `)
    const { total } = countStmt.get(...params)

    const dataStmt = db.prepare(`
      SELECT p.*, 
             c.name as category_name, 
             b.name as brand_name, 
             s.name as supplier_name,
             s.code as supplier_code,
             i.stock_quantity,
             i.warning_line
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `)
    const data = dataStmt.all(...params)

    res.json({
      success: true,
      data: {
        list: data,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    })
  } catch (error) {
    console.error('获取商品列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const product = db.prepare(`
      SELECT p.*, 
             c.name as category_name, 
             b.name as brand_name, 
             s.name as supplier_name,
             i.stock_quantity,
             i.warning_line
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = ?
    `).get(id)

    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }

    res.json({ success: true, data: product })
  } catch (error) {
    console.error('获取商品详情错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/', [
  checkPermission('product:write'),
  body('name').notEmpty().withMessage('商品名称不能为空'),
  body('code').notEmpty().withMessage('商品编号不能为空'),
  body('cost_price').isFloat({ min: 0 }).withMessage('成本价必须大于等于0'),
  body('sell_price').isFloat({ min: 0 }).withMessage('售价必须大于等于0')
], (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { name, code, brand_id, category_id, supplier_id, cost_price, sell_price, keywords, images, is_commentable = 1, description, status = 1, stock_quantity = 0, warning_line = 10 } = req.body

    const existing = db.prepare('SELECT id FROM products WHERE code = ?').get(code)
    if (existing) {
      return res.status(400).json({ success: false, message: '商品编号已存在' })
    }

    const productId = uuidv4()
    
    db.prepare(`
      INSERT INTO products (id, name, code, brand_id, category_id, supplier_id, cost_price, sell_price, keywords, images, is_commentable, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(productId, name, code, brand_id, category_id, supplier_id, parseFloat(cost_price), parseFloat(sell_price), keywords, JSON.stringify(images || []), is_commentable, description, status)

    db.prepare(`
      INSERT INTO inventory (id, product_id, stock_quantity, warning_line)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), productId, parseInt(stock_quantity) || 0, parseInt(warning_line) || 10)

    res.json({ success: true, message: '商品添加成功', data: { id: productId } })
  } catch (error) {
    console.error('添加商品错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.put('/:id', [
  checkPermission('product:write'),
  body('name').notEmpty().withMessage('商品名称不能为空'),
  body('cost_price').isFloat({ min: 0 }).withMessage('成本价必须大于等于0'),
  body('sell_price').isFloat({ min: 0 }).withMessage('售价必须大于等于0')
], (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { id } = req.params
    const { name, brand_id, category_id, supplier_id, cost_price, sell_price, keywords, images, is_commentable, description, status, stock_quantity, warning_line } = req.body

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }

    db.prepare(`
      UPDATE products 
      SET name = ?, brand_id = ?, category_id = ?, supplier_id = ?, cost_price = ?, sell_price = ?, keywords = ?, images = ?, is_commentable = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, brand_id, category_id, supplier_id, parseFloat(cost_price), parseFloat(sell_price), keywords, JSON.stringify(images || []), is_commentable, description, status, id)

    if (stock_quantity !== undefined || warning_line !== undefined) {
      const inventory = db.prepare('SELECT id FROM inventory WHERE product_id = ?').get(id)
      if (inventory) {
        const updates = []
        const params = []
        if (stock_quantity !== undefined) {
          updates.push('stock_quantity = ?')
          params.push(parseInt(stock_quantity))
        }
        if (warning_line !== undefined) {
          updates.push('warning_line = ?')
          params.push(parseInt(warning_line))
        }
        params.push(id)
        db.prepare(`UPDATE inventory SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?`).run(...params)
      }
    }

    res.json({ success: true, message: '商品更新成功' })
  } catch (error) {
    console.error('更新商品错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.put('/:id/status', [
  checkPermission('product:write')
], (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }

    db.prepare('UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id)

    res.json({ success: true, message: status === 1 ? '商品已上架' : '商品已下架' })
  } catch (error) {
    console.error('更新商品状态错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/categories/list', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT id, name, parent_id, sort_order, status
      FROM categories
      ORDER BY sort_order ASC
    `).all()

    res.json({ success: true, data: categories })
  } catch (error) {
    console.error('获取分类列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/categories', [
  checkPermission('product:write'),
  body('name').notEmpty().withMessage('分类名称不能为空')
], (req, res) => {
  try {
    const { name, parent_id, sort_order = 0 } = req.body

    const categoryId = uuidv4()
    db.prepare(`
      INSERT INTO categories (id, name, parent_id, sort_order)
      VALUES (?, ?, ?, ?)
    `).run(categoryId, name, parent_id, sort_order)

    res.json({ success: true, message: '分类添加成功', data: { id: categoryId } })
  } catch (error) {
    console.error('添加分类错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/brands/list', (req, res) => {
  try {
    const brands = db.prepare(`
      SELECT id, name, logo, status
      FROM brands
      WHERE status = 1
      ORDER BY name ASC
    `).all()

    res.json({ success: true, data: brands })
  } catch (error) {
    console.error('获取品牌列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/types/list', (req, res) => {
  try {
    const types = db.prepare(`
      SELECT id, name, description, status
      FROM product_types
      WHERE status = 1
      ORDER BY name ASC
    `).all()

    res.json({ success: true, data: types })
  } catch (error) {
    console.error('获取商品类型列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

module.exports = router
