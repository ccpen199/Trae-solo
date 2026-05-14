const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/questions', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const totalResult = await db.prepare('SELECT COUNT(*) as total FROM questions WHERE user_id = ? AND status = 1').get(req.user.id);
    const total = totalResult.total;

    const questions = await db.prepare(`
      SELECT q.*, u.nickname as author_name, u.avatar as author_avatar,
             c.name as category_name
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN categories c ON q.category_id = c.id
      WHERE q.user_id = ? AND q.status = 1
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, limit, offset);

    res.json({
      success: true,
      data: {
        list: questions,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Get my questions error:', error);
    res.status(500).json({
      success: false,
      message: '获取我的提问失败'
    });
  }
});

router.get('/answers', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const totalResult = await db.prepare('SELECT COUNT(*) as total FROM answers WHERE user_id = ? AND status = 1').get(req.user.id);
    const total = totalResult.total;

    const answers = await db.prepare(`
      SELECT a.*, q.title as question_title,
             u.nickname as author_name, u.avatar as author_avatar
      FROM answers a
      LEFT JOIN questions q ON a.question_id = q.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ? AND a.status = 1 AND q.status = 1
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, limit, offset);

    res.json({
      success: true,
      data: {
        list: answers,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Get my answers error:', error);
    res.status(500).json({
      success: false,
      message: '获取我的回答失败'
    });
  }
});

router.get('/articles', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const totalResult = await db.prepare('SELECT COUNT(*) as total FROM articles WHERE user_id = ? AND status = 1').get(req.user.id);
    const total = totalResult.total;

    const articles = await db.prepare(`
      SELECT a.*, u.nickname as author_name, u.avatar as author_avatar,
             c.name as category_name
      FROM articles a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.user_id = ? AND a.status = 1
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, limit, offset);

    res.json({
      success: true,
      data: {
        list: articles,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Get my articles error:', error);
    res.status(500).json({
      success: false,
      message: '获取我的文章失败'
    });
  }
});

module.exports = router;
