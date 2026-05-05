const express = require('express')
const router = express.Router()
const db = require('../database')
const { authenticateToken, checkPermission } = require('../middleware/auth')
const { v4: uuidv4 } = require('uuid')
const dayjs = require('dayjs')

router.use(authenticateToken)

const statusMap = {
  1: '待付款',
  2: '待发货',
  3: '已发货',
  4: '已完成',
  5: '待退款',
  6: '已退款'
}

router.get('/', [
  checkPermission('order:read')
], (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, orderType, status } = req.query
    const offset = (page - 1) * pageSize

    let whereClause = '1=1'
    const params = []

    if (keyword) {
      whereClause += ' AND (o.order_no LIKE ? OR c.username LIKE ? OR c.account LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    
    if (status !== undefined && status !== '') {
      whereClause += ' AND o.status = ?'
      params.push(parseInt(status))
    } else if (orderType === 'pending_ship') {
      whereClause += ' AND o.status = 2'
    } else if (orderType === 'pending_refund') {
      whereClause += ' AND o.status = 5'
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE ${whereClause}
    `)
    const { total } = countStmt.get(...params)

    const dataStmt = db.prepare(`
      SELECT o.*, c.username as customer_name, c.account as customer_account
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `)
    const data = dataStmt.all(...params)

    data.forEach(order => {
      order.status_text = statusMap[order.status] || '未知'
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
    console.error('获取订单列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/:id', [
  checkPermission('order:read')
], (req, res) => {
  try {
    const { id } = req.params
    const order = db.prepare(`
      SELECT o.*, c.username as customer_name, c.account as customer_account, c.gender, c.address as customer_address
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(id)

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }

    order.status_text = statusMap[order.status] || '未知'

    const items = db.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `).all(id)

    order.items = items

    const logistics = db.prepare(`
      SELECT * FROM logistics WHERE order_id = ? ORDER BY created_at ASC
    `).all(id)

    order.logistics = logistics

    res.json({ success: true, data: order })
  } catch (error) {
    console.error('获取订单详情错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.put('/:id/status', [
  checkPermission('order:write')
], (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id)

    res.json({ success: true, message: `订单状态已更新为: ${statusMap[status] || '未知'}` })
  } catch (error) {
    console.error('更新订单状态错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/:id/ship', [
  checkPermission('order:write')
], (req, res) => {
  try {
    const { id } = req.params
    const { logisticsNo, logisticsCompany, operator } = req.body

    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }

    if (existing.status !== 2) {
      return res.status(400).json({ success: false, message: '只有待发货状态的订单可以发货' })
    }

    const logisticsId = uuidv4()
    const logisticsNoFinal = logisticsNo || 'WL' + dayjs().format('YYYYMMDDHHmmss')

    db.prepare(`
      INSERT INTO logistics (id, logistics_no, order_id, status, description, location, operator)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(logisticsId, logisticsNoFinal, id, '已发货', '订单已发货，等待揽收', '仓库', operator || '系统')

    db.prepare('UPDATE orders SET status = 3, logistics_no = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(logisticsNoFinal, id)

    res.json({ success: true, message: '发货成功', data: { logistics_no: logisticsNoFinal } })
  } catch (error) {
    console.error('发货错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/logistics/query', [
  checkPermission('order:read')
], (req, res) => {
  try {
    const { logisticsNo, orderNo } = req.query

    if (!logisticsNo && !orderNo) {
      return res.status(400).json({ success: false, message: '请提供物流编号或订单编号' })
    }

    let logistics
    let order

    if (logisticsNo) {
      logistics = db.prepare(`
        SELECT l.*, o.order_no, o.status as order_status
        FROM logistics l
        LEFT JOIN orders o ON l.order_id = o.id
        WHERE l.logistics_no = ?
        ORDER BY l.created_at ASC
      `).all(logisticsNo)
    } else if (orderNo) {
      order = db.prepare('SELECT * FROM orders WHERE order_no = ?').get(orderNo)
      if (order) {
        logistics = db.prepare(`
          SELECT l.*, o.order_no, o.status as order_status
          FROM logistics l
          LEFT JOIN orders o ON l.order_id = o.id
          WHERE l.order_id = ?
          ORDER BY l.created_at ASC
        `).all(order.id)
      }
    }

    res.json({
      success: true,
      data: {
        order,
        logistics: logistics || [],
        current_status: logistics && logistics.length > 0 ? logistics[logistics.length - 1].status : (order ? statusMap[order.status] : '无物流信息')
      }
    })
  } catch (error) {
    console.error('查询物流错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

module.exports = router
