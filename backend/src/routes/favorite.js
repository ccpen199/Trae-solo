const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, targetType } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    let whereClause = 'f.user_id = ?';
    const params = [req.user.id];

    if (targetType) {
      whereClause += ' AND f.target_type = ?';
      params.push(targetType);
    }

    const countSql = `SELECT COUNT(*) as total FROM favorites f WHERE ${whereClause}`;
    const totalResult = await db.prepare(countSql).get(...params);
    const total = totalResult.total;

    let items = [];
    
    const favorites = await db.prepare(`SELECT * FROM favorites f WHERE ${whereClause} ORDER BY f.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);

    const questionIds = favorites.filter(f => f.target_type === 'question').map(f => f.target_id);
    const articleIds = favorites.filter(f => f.target_type === 'article').map(f => f.target_id);

    let questions = [];
    let articles = [];

    if (questionIds.length > 0) {
      const placeholders = questionIds.map(() => '?').join(',');
      questions = await db.prepare(`
        SELECT q.*, 'question' as target_type, u.nickname as author_name, u.avatar as author_avatar
        FROM questions q
        LEFT JOIN users u ON q.user_id = u.id
        WHERE q.id IN (${placeholders}) AND q.status = 1
      `).all(...questionIds);
    }

    if (articleIds.length > 0) {
      const placeholders = articleIds.map(() => '?').join(',');
      articles = await db.prepare(`
        SELECT a.*, 'article' as target_type, u.nickname as author_name, u.avatar as author_avatar
        FROM articles a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.id IN (${placeholders}) AND a.status = 1
      `).all(...articleIds);
    }

    const itemMap = {};
    for (const q of questions) {
      itemMap[`question_${q.id}`] = q;
    }
    for (const a of articles) {
      itemMap[`article_${a.id}`] = a;
    }

    items = favorites.map(f => itemMap[`${f.target_type}_${f.target_id}`]).filter(Boolean);

    res.json({
      success: true,
      data: {
        list: items,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: '获取收藏列表失败'
    });
  }
});

module.exports = router;
