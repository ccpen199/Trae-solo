const express = require('express')
const db = require('../database')
const { authenticateToken, optionalAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/hot', (req, res) => {
  try {
    const hotSearches = db.prepare(`
      SELECT keyword, search_count
      FROM hot_searches
      ORDER BY search_count DESC
      LIMIT 10
    `).all()

    res.json({ success: true, data: hotSearches })
  } catch (error) {
    console.error('获取热搜失败:', error)
    res.status(500).json({ success: false, message: '获取热搜失败' })
  }
})

router.get('/history', authenticateToken, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT DISTINCT keyword
      FROM search_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(req.user.id)

    res.json({ success: true, data: history })
  } catch (error) {
    console.error('获取搜索历史失败:', error)
    res.status(500).json({ success: false, message: '获取搜索历史失败' })
  }
})

router.delete('/history', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM search_history WHERE user_id = ?').run(req.user.id)
    res.json({ success: true, message: '搜索历史已清空' })
  } catch (error) {
    console.error('清空搜索历史失败:', error)
    res.status(500).json({ success: false, message: '清空搜索历史失败' })
  }
})

router.get('/', optionalAuth, (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({ success: false, message: '搜索关键词不能为空' })
    }

    if (req.user) {
      db.prepare('INSERT INTO search_history (user_id, keyword) VALUES (?, ?)').run(req.user.id, keyword)
    }

    const hotSearch = db.prepare('SELECT * FROM hot_searches WHERE keyword = ?').get(keyword)
    if (hotSearch) {
      db.prepare('UPDATE hot_searches SET search_count = search_count + 1 WHERE id = ?').run(hotSearch.id)
    }

    const searchKeyword = `%${keyword.toLowerCase()}%`
    const questions = db.prepare(`
      SELECT q.*, u.nickname, u.avatar
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      WHERE LOWER(q.title) LIKE ? OR LOWER(q.content) LIKE ?
      ORDER BY q.view_count DESC, q.created_at DESC
      LIMIT ? OFFSET ?
    `).all(searchKeyword, searchKeyword, limit, offset)

    const total = db.prepare(`
      SELECT COUNT(*) as count
      FROM questions
      WHERE LOWER(title) LIKE ? OR LOWER(content) LIKE ?
    `).get(searchKeyword, searchKeyword).count

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
    console.error('搜索失败:', error)
    res.status(500).json({ success: false, message: '搜索失败' })
  }
})

module.exports = router
