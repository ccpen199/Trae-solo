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

    const { page = 1, pageSize = 10, keyword, status } = req.query
    const offset = (page - 1) * pageSize

    let whereClause = '1=1'
    const params = []

    if (keyword) {
      whereClause += ' AND (name LIKE ? OR code LIKE ? OR contact LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (status !== undefined && status !== '') {
      whereClause += ' AND status = ?'
      params.push(parseInt(status))
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM suppliers WHERE ${whereClause}
    `)
    const { total } = countStmt.get(...params)

    const dataStmt = db.prepare(`
      SELECT * FROM suppliers
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `)
    const data = dataStmt.all(...params)

    data.forEach(item => {
      item.status_text = item.status === 1 ? '合作中' : '已终止'
    })

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
    console.error('获取供应商列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/list', (req, res) => {
  try {
    const suppliers = db.prepare(`
      SELECT id, code, name, main_products, region, status
      FROM suppliers
      WHERE status = 1
      ORDER BY name ASC
    `).all()

    res.json({ success: true, data: suppliers })
  } catch (error) {
    console.error('获取供应商简单列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id)

    if (!supplier) {
      return res.status(404).json({ success: false, message: '供应商不存在' })
    }

    supplier.status_text = supplier.status === 1 ? '合作中' : '已终止'

    const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE supplier_id = ?').get(id).count
    supplier.product_count = productCount

    const products = db.prepare(`
      SELECT p.*, c.name as category_name, i.stock_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.supplier_id = ?
      ORDER BY p.created_at DESC
      LIMIT 20
    `).all(id)
    supplier.products = products

    res.json({ success: true, data: supplier })
  } catch (error) {
    console.error('获取供应商详情错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/', [
  checkPermission('supplier:write'),
  body('name').notEmpty().withMessage('供应商名称不能为空'),
  body('code').notEmpty().withMessage('供应商编号不能为空')
], (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { code, name, main_products, region, phone, contact, status = 1 } = req.body

    const existing = db.prepare('SELECT id FROM suppliers WHERE code = ?').get(code)
    if (existing) {
      return res.status(400).json({ success: false, message: '供应商编号已存在' })
    }

    const supplierId = uuidv4()
    
    db.prepare(`
      INSERT INTO suppliers (id, code, name, main_products, region, phone, contact, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(supplierId, code, name, main_products, region, phone, contact, status)

    res.json({ success: true, message: '供应商添加成功', data: { id: supplierId } })
  } catch (error) {
    console.error('添加供应商错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.put('/:id', [
  checkPermission('supplier:write'),
  body('name').notEmpty().withMessage('供应商名称不能为空')
], (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { id } = req.params
    const { name, main_products, region, phone, contact, status } = req.body

    const existing = db.prepare('SELECT id FROM suppliers WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '供应商不存在' })
    }

    db.prepare(`
      UPDATE suppliers 
      SET name = ?, main_products = ?, region = ?, phone = ?, contact = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, main_products, region, phone, contact, status, id)

    res.json({ success: true, message: '更新成功' })
  } catch (error) {
    console.error('更新供应商错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

module.exports = router
