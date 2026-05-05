const express = require('express')
const router = express.Router()
const db = require('../database')
const { authenticateToken, checkPermission } = require('../middleware/auth')

router.use(authenticateToken)

router.get('/', [
  checkPermission('inventory:read')
], (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, lowStock, supplierId, categoryId } = req.query
    const offset = (page - 1) * pageSize

    let whereClause = '1=1'
    const params = []

    if (keyword) {
      whereClause += ' AND (p.name LIKE ? OR p.code LIKE ? OR s.name LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (lowStock === 'true') {
      whereClause += ' AND i.stock_quantity <= i.warning_line'
    }
    if (supplierId) {
      whereClause += ' AND p.supplier_id = ?'
      params.push(supplierId)
    }
    if (categoryId) {
      whereClause += ' AND p.category_id = ?'
      params.push(categoryId)
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total 
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE ${whereClause}
    `)
    const { total } = countStmt.get(...params)

    const dataStmt = db.prepare(`
      SELECT i.*, 
             p.name as product_name, 
             p.code as product_code,
             p.cost_price,
             p.sell_price,
             p.status as product_status,
             s.name as supplier_name,
             s.code as supplier_code,
             c.name as category_name
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
      ORDER BY i.stock_quantity ASC, i.updated_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `)
    const data = dataStmt.all(...params)

    data.forEach(item => {
      if (item.stock_quantity <= item.warning_line) {
        item.status = '不足'
        item.status_type = 'danger'
      } else {
        item.status = '稳定'
        item.status_type = 'success'
      }
    })

    const lowStockCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM inventory 
      WHERE stock_quantity <= warning_line
    `).get().count

    const totalStockValue = db.prepare(`
      SELECT IFNULL(SUM(i.stock_quantity * p.cost_price), 0) as total
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
    `).get().total

    res.json({
      success: true,
      data: {
        list: data,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        stats: {
          lowStockCount,
          totalStockValue: parseFloat(totalStockValue) || 0
        }
      }
    })
  } catch (error) {
    console.error('获取库存列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/product/:productId', [
  checkPermission('inventory:read')
], (req, res) => {
  try {
    const { productId } = req.params
    
    const inventory = db.prepare(`
      SELECT i.*, 
             p.name as product_name, 
             p.code as product_code,
             p.cost_price,
             p.sell_price,
             s.name as supplier_name
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE i.product_id = ?
    `).get(productId)

    if (!inventory) {
      const product = db.prepare(`
        SELECT p.*, s.name as supplier_name
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ?
      `).get(productId)

      if (!product) {
        return res.status(404).json({ success: false, message: '商品不存在' })
      }

      return res.json({
        success: true,
        data: {
          product_id: productId,
          stock_quantity: 0,
          warning_line: 10,
          product_name: product.name,
          product_code: product.code,
          cost_price: product.cost_price,
          sell_price: product.sell_price,
          supplier_name: product.supplier_name,
          status: '不足',
          status_type: 'danger'
        }
      })
    }

    if (inventory.stock_quantity <= inventory.warning_line) {
      inventory.status = '不足'
      inventory.status_type = 'danger'
    } else {
      inventory.status = '稳定'
      inventory.status_type = 'success'
    }

    res.json({ success: true, data: inventory })
  } catch (error) {
    console.error('获取商品库存错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.put('/product/:productId', [
  checkPermission('inventory:write')
], (req, res) => {
  try {
    const { productId } = req.params
    const { stock_quantity, warning_line } = req.body

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId)
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }

    const existing = db.prepare('SELECT id FROM inventory WHERE product_id = ?').get(productId)

    if (existing) {
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
      params.push(productId)
      
      db.prepare(`UPDATE inventory SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?`).run(...params)
    } else {
      db.prepare(`
        INSERT INTO inventory (id, product_id, stock_quantity, warning_line)
        VALUES (?, ?, ?, ?)
      `).run(uuidv4(), productId, parseInt(stock_quantity) || 0, parseInt(warning_line) || 10)
    }

    res.json({ success: true, message: '库存更新成功' })
  } catch (error) {
    console.error('更新库存错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/warnings', [
  checkPermission('inventory:read')
], (req, res) => {
  try {
    const warnings = db.prepare(`
      SELECT i.*, 
             p.name as product_name, 
             p.code as product_code,
             s.name as supplier_name
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE i.stock_quantity <= i.warning_line
      ORDER BY i.stock_quantity ASC
    `).all()

    res.json({
      success: true,
      data: warnings
    })
  } catch (error) {
    console.error('获取库存预警错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

module.exports = router
