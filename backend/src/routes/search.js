const express = require('express');
const { db } = require('../db');
const { optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 20, type = 'all' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    if (!keyword || keyword.trim().length === 0) {
      return res.json({
        success: true,
        data: {
          list: [],
          total: 0,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: 0
        }
      });
    }

    const searchKeyword = `%${keyword.trim()}%`;

    if (type === 'question' || type === 'all') {
      const questions = await db.prepare(`
        SELECT q.*, 'question' as result_type, u.nickname as author_name, u.avatar as author_avatar
        FROM questions q
        LEFT JOIN users u ON q.user_id = u.id
        WHERE q.status = 1 AND (q.title LIKE ? OR q.content LIKE ?)
        ORDER BY q.views DESC, q.likes_count DESC, q.created_at DESC
        LIMIT ? OFFSET ?
      `).all(searchKeyword, searchKeyword, limit, offset);

      const total = await db.prepare(`
        SELECT COUNT(*) as count FROM questions 
        WHERE status = 1 AND (title LIKE ? OR content LIKE ?)
      `).get(searchKeyword, searchKeyword).count;

      if (type === 'question') {
        return res.json({
          success: true,
          data: {
            list: questions,
            total,
            page: Number(page),
            pageSize: Number(pageSize),
            totalPages: Math.ceil(total / Number(pageSize))
          }
        });
      }

      const articles = await db.prepare(`
        SELECT a.*, 'article' as result_type, u.nickname as author_name, u.avatar as author_avatar
        FROM articles a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.status = 1 AND (a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)
        ORDER BY a.views DESC, a.likes_count DESC, a.created_at DESC
        LIMIT ? OFFSET ?
      `).all(searchKeyword, searchKeyword, searchKeyword, limit, offset);

      const articleTotal = await db.prepare(`
        SELECT COUNT(*) as count FROM articles 
        WHERE status = 1 AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)
      `).get(searchKeyword, searchKeyword, searchKeyword).count;

      const merged = [...questions, ...articles].sort((a, b) => b.created_at - a.created_at).slice(0, limit);

      return res.json({
        success: true,
        data: {
          list: merged,
          total: total + articleTotal,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil((total + articleTotal) / Number(pageSize))
        }
      });
    }

    if (type === 'article') {
      const articles = await db.prepare(`
        SELECT a.*, 'article' as result_type, u.nickname as author_name, u.avatar as author_avatar
        FROM articles a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.status = 1 AND (a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)
        ORDER BY a.views DESC, a.likes_count DESC, a.created_at DESC
        LIMIT ? OFFSET ?
      `).all(searchKeyword, searchKeyword, searchKeyword, limit, offset);

      const total = await db.prepare(`
        SELECT COUNT(*) as count FROM articles 
        WHERE status = 1 AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)
      `).get(searchKeyword, searchKeyword, searchKeyword).count;

      return res.json({
        success: true,
        data: {
          list: articles,
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / Number(pageSize))
        }
      });
    }

    if (type === 'user') {
      const users = await db.prepare(`
        SELECT id, username, nickname, avatar, bio, role, status,
               (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers
        FROM users u
        WHERE u.status = 1 AND (u.username LIKE ? OR u.nickname LIKE ?)
        ORDER BY followers DESC
        LIMIT ? OFFSET ?
      `).all(searchKeyword, searchKeyword, limit, offset);

      const total = await db.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE status = 1 AND (username LIKE ? OR nickname LIKE ?)
      `).get(searchKeyword, searchKeyword).count;

      return res.json({
        success: true,
        data: {
          list: users,
          total,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: Math.ceil(total / Number(pageSize))
        }
      });
    }

    res.json({
      success: true,
      data: {
        list: [],
        total: 0,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: 0
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: '搜索失败，请稍后重试'
    });
  }
});

module.exports = router;
