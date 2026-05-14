const express = require('express')
const db = require('../database')
const { authenticateToken, optionalAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/', optionalAuth, (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'hot' } = req.query
    const offset = (page - 1) * limit

    let orderBy = 'q.view_count DESC, q.follow_count DESC, q.created_at DESC'
    if (sort === 'new') {
      orderBy = 'q.created_at DESC'
    }

    const questions = db.prepare(`
      SELECT q.*, u.nickname, u.avatar,
        EXISTS(SELECT 1 FROM follows f WHERE f.user_id = ? AND f.question_id = q.id) as is_followed
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(req.user?.id || null, limit, offset)

    const total = db.prepare('SELECT COUNT(*) as count FROM questions').get().count

    res.json({
      success: true,
      data: {
        list: questions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total
        }
      }
    })
  } catch (error) {
    console.error('获取问题列表失败:', error)
    res.status(500).json({ success: false, message: '获取问题列表失败' })
  }
})

router.get('/:id', optionalAuth, (req, res) => {
  try {
    const { id } = req.params

    db.prepare('UPDATE questions SET view_count = view_count + 1 WHERE id = ?').run(id)

    const question = db.prepare(`
      SELECT q.*, u.nickname, u.avatar,
        EXISTS(SELECT 1 FROM follows f WHERE f.user_id = ? AND f.question_id = q.id) as is_followed
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      WHERE q.id = ?
    `).get(req.user?.id || null, id)

    if (!question) {
      return res.status(404).json({ success: false, message: '问题不存在' })
    }

    res.json({ success: true, data: question })
  } catch (error) {
    console.error('获取问题详情失败:', error)
    res.status(500).json({ success: false, message: '获取问题详情失败' })
  }
})

router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, content, is_paid = 0, price = 0 } = req.body

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: '问题标题不能为空' })
    }

    const result = db.prepare(`
      INSERT INTO questions (user_id, title, content, is_paid, price)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, title.trim(), content || '', is_paid, price)

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '问题发布成功'
    })
  } catch (error) {
    console.error('发布问题失败:', error)
    res.status(500).json({ success: false, message: '发布问题失败' })
  }
})

router.post('/:id/follow', authenticateToken, (req, res) => {
  try {
    const { id } = req.params

    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(id)
    if (!question) {
      return res.status(404).json({ success: false, message: '问题不存在' })
    }

    try {
      db.prepare('INSERT INTO follows (user_id, question_id) VALUES (?, ?)').run(req.user.id, id)
      db.prepare('UPDATE questions SET follow_count = follow_count + 1 WHERE id = ?').run(id)
      res.json({ success: true, data: { is_followed: true }, message: '关注成功' })
    } catch (e) {
      db.prepare('DELETE FROM follows WHERE user_id = ? AND question_id = ?').run(req.user.id, id)
      db.prepare('UPDATE questions SET follow_count = follow_count - 1 WHERE id = ?').run(id)
      res.json({ success: true, data: { is_followed: false }, message: '取消关注成功' })
    }
  } catch (error) {
    console.error('关注问题失败:', error)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

module.exports = router
