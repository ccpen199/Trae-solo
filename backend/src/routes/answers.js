const express = require('express')
const db = require('../database')
const { authenticateToken, optionalAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/question/:questionId', optionalAuth, (req, res) => {
  try {
    const { questionId } = req.params
    const { page = 1, limit = 10, sort = 'hot' } = req.query
    const offset = (page - 1) * limit

    let orderBy = 'a.sort_weight DESC, a.like_count DESC, a.created_at DESC'
    if (sort === 'new') {
      orderBy = 'a.created_at DESC'
    }
    if (sort === 'time') {
      orderBy = 'a.created_at ASC'
    }

    const answers = db.prepare(`
      SELECT a.*, u.nickname, u.avatar,
        EXISTS(SELECT 1 FROM likes l WHERE l.user_id = ? AND l.answer_id = a.id) as is_liked,
        EXISTS(SELECT 1 FROM favorites f WHERE f.user_id = ? AND f.answer_id = a.id) as is_favorited
      FROM answers a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.question_id = ?
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(req.user?.id || null, req.user?.id || null, questionId, limit, offset)

    const total = db.prepare('SELECT COUNT(*) as count FROM answers WHERE question_id = ?').get(questionId).count

    res.json({
      success: true,
      data: {
        list: answers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total
        }
      }
    })
  } catch (error) {
    console.error('获取回答列表失败:', error)
    res.status(500).json({ success: false, message: '获取回答列表失败' })
  }
})

router.post('/', authenticateToken, (req, res) => {
  try {
    const { question_id, content } = req.body

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: '回答内容不能为空' })
    }

    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(question_id)
    if (!question) {
      return res.status(404).json({ success: false, message: '问题不存在' })
    }

    const result = db.prepare(`
      INSERT INTO answers (question_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(question_id, req.user.id, content.trim())

    db.prepare('UPDATE questions SET answer_count = answer_count + 1 WHERE id = ?').run(question_id)

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
      message: '回答发布成功'
    })
  } catch (error) {
    console.error('发布回答失败:', error)
    res.status(500).json({ success: false, message: '发布回答失败' })
  }
})

router.post('/:id/like', authenticateToken, (req, res) => {
  try {
    const { id } = req.params

    const answer = db.prepare('SELECT * FROM answers WHERE id = ?').get(id)
    if (!answer) {
      return res.status(404).json({ success: false, message: '回答不存在' })
    }

    try {
      db.prepare('INSERT INTO likes (user_id, answer_id) VALUES (?, ?)').run(req.user.id, id)
      db.prepare('UPDATE answers SET like_count = like_count + 1 WHERE id = ?').run(id)
      res.json({ success: true, data: { is_liked: true, like_count: answer.like_count + 1 }, message: '点赞成功' })
    } catch (e) {
      db.prepare('DELETE FROM likes WHERE user_id = ? AND answer_id = ?').run(req.user.id, id)
      db.prepare('UPDATE answers SET like_count = like_count - 1 WHERE id = ?').run(id)
      res.json({ success: true, data: { is_liked: false, like_count: answer.like_count - 1 }, message: '取消点赞成功' })
    }
  } catch (error) {
    console.error('点赞失败:', error)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

router.post('/:id/favorite', authenticateToken, (req, res) => {
  try {
    const { id } = req.params

    const answer = db.prepare('SELECT * FROM answers WHERE id = ?').get(id)
    if (!answer) {
      return res.status(404).json({ success: false, message: '回答不存在' })
    }

    try {
      db.prepare('INSERT INTO favorites (user_id, answer_id) VALUES (?, ?)').run(req.user.id, id)
      res.json({ success: true, data: { is_favorited: true }, message: '收藏成功' })
    } catch (e) {
      db.prepare('DELETE FROM favorites WHERE user_id = ? AND answer_id = ?').run(req.user.id, id)
      res.json({ success: true, data: { is_favorited: false }, message: '取消收藏成功' })
    }
  } catch (error) {
    console.error('收藏失败:', error)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

module.exports = router
