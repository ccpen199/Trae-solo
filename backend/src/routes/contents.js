const express = require('express')
const router = express.Router()
const db = require('../database')
const { authenticateToken, checkPermission } = require('../middleware/auth')
const { v4: uuidv4 } = require('uuid')
const { body, validationResult, query } = require('express-validator')

router.use(authenticateToken)

router.get('/', [
  query('type').notEmpty().withMessage('类型不能为空'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
], (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { type, page = 1, pageSize = 10, keyword, status } = req.query
    const offset = (page - 1) * pageSize

    let whereClause = 'type = ?'
    const params = [type]

    if (keyword) {
      whereClause += ' AND (title LIKE ? OR content LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (status !== undefined && status !== '') {
      whereClause += ' AND status = ?'
      params.push(parseInt(status))
    }

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM contents WHERE ${whereClause}
    `)
    const { total } = countStmt.get(...params)

    const dataStmt = db.prepare(`
      SELECT * FROM contents
      WHERE ${whereClause}
      ORDER BY sort_order ASC, created_at DESC
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
    console.error('获取内容列表错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(id)

    if (!content) {
      return res.status(404).json({ success: false, message: '内容不存在' })
    }

    res.json({ success: true, data: content })
  } catch (error) {
    console.error('获取内容详情错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.post('/', [
  checkPermission('content:write'),
  body('type').notEmpty().withMessage('类型不能为空'),
  body('title').notEmpty().withMessage('标题不能为空')
], (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { type, title, content, image, link, sort_order = 0, status = 1, start_time, end_time, coupon_code, discount_amount, min_amount } = req.body

    const contentId = uuidv4()
    
    db.prepare(`
      INSERT INTO contents (id, type, title, content, image, link, sort_order, status, start_time, end_time, coupon_code, discount_amount, min_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(contentId, type, title, content, image, link, sort_order, status, start_time, end_time, coupon_code, discount_amount ? parseFloat(discount_amount) : null, min_amount ? parseFloat(min_amount) : null)

    res.json({ success: true, message: '添加成功', data: { id: contentId } })
  } catch (error) {
    console.error('添加内容错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.put('/:id', [
  checkPermission('content:write'),
  body('title').notEmpty().withMessage('标题不能为空')
], (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { id } = req.params
    const { title, content, image, link, sort_order, status, start_time, end_time, coupon_code, discount_amount, min_amount } = req.body

    const existing = db.prepare('SELECT id FROM contents WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '内容不存在' })
    }

    db.prepare(`
      UPDATE contents 
      SET title = ?, content = ?, image = ?, link = ?, sort_order = ?, status = ?, start_time = ?, end_time = ?, coupon_code = ?, discount_amount = ?, min_amount = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, content, image, link, sort_order, status, start_time, end_time, coupon_code, discount_amount ? parseFloat(discount_amount) : null, min_amount ? parseFloat(min_amount) : null, id)

    res.json({ success: true, message: '更新成功' })
  } catch (error) {
    console.error('更新内容错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

router.delete('/:id', [
  checkPermission('content:write')
], (req, res) => {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM contents WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '内容不存在' })
    }

    db.prepare('DELETE FROM contents WHERE id = ?').run(id)

    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('删除内容错误:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

module.exports = router
