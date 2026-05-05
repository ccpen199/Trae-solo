const express = require('express')
const router = express.Router()
const db = require('../database')
const { authenticateToken, checkPermission } = require('../middleware/auth')
const { v4: uuidv4 } = require('uuid')
const dayjs = require('dayjs')

router.use(authenticateToken)

const statusMap = {
  1: '待确认',
  2: '已确认',
  3: '已发货',
  4: '已收货',
  5: '已完成'
}

router.get('/', [
  checkPermission('purchase:read')
], (req, res) => {
  try {
    const { page = 1, pageSize = 10, supplierId, status } = req.query
    const offset = (page - 1) * pageSize

    let whereClause = '1=1'
    const params = []

    if (supplierId) {
      whereClause += ' AND po.supplier_id = ?'
      params.push(supplierId)
    }
    if (status !== undefined && status !== '') {
      whereClause += ' AND po.status = ?'
      params.push(parseInt(status))
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM purchase_orders po WHERE ${whereClause}
    `)
    const { total } = countStmt.get(...params)

    const dataStmt = db.prepare(`
      SELECT po.*, s.name as supplier_name, s.code as supplier_code
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE ${whereClause}
      ORDER BY po.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `)
    const data = dataStmt.all(...params)

    data.forEach(item => {
      item.status_text = statusMap[item.status] || '未知'
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
    console.error('获取采购单列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/:id', [
  checkPermission('purchase:read')
], (req, res) => {
  try {
    const { id } = req.params
    const purchase = db.prepare(`
      SELECT po.*, s.name as supplier_name, s.code as supplier_code, s.phone as supplier_phone, s.contact as supplier_contact
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ?
    `).get(id)

    if (!purchase) {
      return res.status(404).json({ success: false, message: '采购单不存在' })
    }

    purchase.status_text = statusMap[purchase.status] || '未知'

    const items = db.prepare(`
      SELECT pi.*, p.name as product_name, p.code as product_code
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.id
      WHERE pi.purchase_id = ?
    `).all(id)

    purchase.items = items

    res.json({ success: true, data: purchase })
  } catch (error) {
    console.error('获取采购单详情错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/', [
  checkPermission('purchase:write')
], (req, res) => {
  try {
    const { supplier_id, items, remark } = req.body

    if (!supplier_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: '请选择供应商和采购商品' })
    }

    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(supplier_id)
    if (!supplier) {
      return res.status(400).json({ success: false, message: '供应商不存在' })
    }

    let totalAmount = 0
    const itemErrors = []

    items.forEach((item, index) => {
      if (!item.product_id) {
        itemErrors.push(`第${index + 1}行: 请选择商品`)
      }
      if (!item.quantity || item.quantity <= 0) {
        itemErrors.push(`第${index + 1}行: 数量必须大于0`)
      }
      if (!item.unit_price || item.unit_price < 0) {
        itemErrors.push(`第${index + 1}行: 单价不能为负`)
      }
      totalAmount += (item.quantity || 0) * (item.unit_price || 0)
    })

    if (itemErrors.length > 0) {
      return res.status(400).json({ success: false, message: itemErrors.join('; ') })
    }

    const purchaseId = uuidv4()
    const purchaseNo = 'PO' + dayjs().format('YYYYMMDDHHmmss')

    db.prepare(`
      INSERT INTO purchase_orders (id, purchase_no, supplier_id, total_amount, remark, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(purchaseId, purchaseNo, supplier_id, totalAmount, remark, 1)

    items.forEach(item => {
      const itemId = uuidv4()
      const totalPrice = item.quantity * item.unit_price
      
      db.prepare(`
        INSERT INTO purchase_items (id, purchase_id, product_id, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(itemId, purchaseId, item.product_id, item.quantity, item.unit_price, totalPrice)
    })

    res.json({ success: true, message: '采购单创建成功', data: { id: purchaseId, purchase_no: purchaseNo } })
  } catch (error) {
    console.error('创建采购单错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.put('/:id/status', [
  checkPermission('purchase:write')
], (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const purchase = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(id)
    if (!purchase) {
      return res.status(404).json({ success: false, message: '采购单不存在' })
    }

    if (status === 4 && purchase.status !== 3) {
      return res.status(400).json({ success: false, message: '只有已发货状态的采购单可以确认收货' })
    }

    if (status === 4) {
      const items = db.prepare(`
        SELECT pi.product_id, pi.quantity 
        FROM purchase_items pi 
        WHERE pi.purchase_id = ?
      `).all(id)

      items.forEach(item => {
        const inventory = db.prepare('SELECT id FROM inventory WHERE product_id = ?').get(item.product_id)
        if (inventory) {
          db.prepare('UPDATE inventory SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?').run(item.quantity, item.product_id)
        } else {
          db.prepare(`
            INSERT INTO inventory (id, product_id, stock_quantity, warning_line)
            VALUES (?, ?, ?, 10)
          `).run(uuidv4(), item.product_id, item.quantity)
        }
      })
    }

    db.prepare('UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id)

    res.json({ success: true, message: `采购单状态已更新为: ${statusMap[status] || '未知'}` })
  } catch (error) {
    console.error('更新采购单状态错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/supplier/products/:supplierId', [
  checkPermission('purchase:read')
], (req, res) => {
  try {
    const { supplierId } = req.params
    
    const products = db.prepare(`
      SELECT p.*, c.name as category_name, i.stock_quantity, i.warning_line
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.supplier_id = ? AND p.status = 1
      ORDER BY p.name ASC
    `).all(supplierId)

    res.json({ success: true, data: products })
  } catch (error) {
    console.error('获取供应商商品错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

module.exports = router
