const express = require('express')
const router = express.Router()
const db = require('../database')
const { authenticateToken, checkPermission } = require('../middleware/auth')
const { v4: uuidv4 } = require('uuid')
const { body, validationResult, query } = require('express-validator')

router.use(authenticateToken)

router.get('/', [
  checkPermission('user:read'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
], (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { page = 1, pageSize = 10, keyword, userType } = req.query
    const offset = (page - 1) * pageSize

    let whereClause = '1=1'
    const params = []

    if (keyword) {
      whereClause += ' AND (id LIKE ? OR account LIKE ? OR username LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (userType !== undefined && userType !== '') {
      whereClause += ' AND user_type = ?'
      params.push(parseInt(userType))
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM customers WHERE ${whereClause}
    `)
    const { total } = countStmt.get(...params)

    const dataStmt = db.prepare(`
      SELECT * FROM customers
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `)
    const data = dataStmt.all(...params)

    const genderMap = { 0: '未知', 1: '男', 2: '女' }
    const typeMap = { 1: '普通用户', 2: 'VIP用户', 3: '企业用户' }

    data.forEach(item => {
      item.gender_text = genderMap[item.gender] || '未知'
      item.user_type_text = typeMap[item.user_type] || '普通用户'
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
    console.error('获取用户列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/:id', [
  checkPermission('user:read')
], (req, res) => {
  try {
    const { id } = req.params
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id)

    if (!customer) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    const orders = db.prepare(`
      SELECT COUNT(*) as order_count, IFNULL(SUM(total_amount), 0) as total_spent
      FROM orders WHERE customer_id = ?
    `).get(id)

    customer.order_count = orders.order_count
    customer.total_spent = parseFloat(orders.total_spent) || 0

    const recentOrders = db.prepare(`
      SELECT * FROM orders 
      WHERE customer_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(id)

    customer.recent_orders = recentOrders

    res.json({ success: true, data: customer })
  } catch (error) {
    console.error('获取用户详情错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.put('/:id', [
  checkPermission('user:write'),
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('account').notEmpty().withMessage('账号不能为空')
], (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { id } = req.params
    const { username, gender, address, user_type } = req.body

    const existing = db.prepare('SELECT id FROM customers WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    db.prepare(`
      UPDATE customers 
      SET username = ?, gender = ?, address = ?, user_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(username, gender || 0, address, user_type || 1, id)

    res.json({ success: true, message: '更新成功' })
  } catch (error) {
    console.error('更新用户错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.delete('/:id', [
  checkPermission('user:write')
], (req, res) => {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM customers WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer_id = ?').get(id).count
    if (orderCount > 0) {
      return res.status(400).json({ success: false, message: '该用户存在订单记录，无法删除' })
    }

    db.prepare('DELETE FROM customers WHERE id = ?').run(id)

    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('删除用户错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

module.exports = router
