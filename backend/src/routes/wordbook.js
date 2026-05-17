const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.post('/add', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const { word, phonetic, meaning, example } = req.body;

    if (!word || !meaning) {
      return res.status(400).json({
        success: false,
        message: '单词和释义不能为空'
      });
    }

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO word_books (user_id, word, phonetic, meaning, example)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(req.user.id, word, phonetic || '', meaning, example || '');

    res.json({
      success: true,
      message: result.changes > 0 ? '添加成功' : '单词已存在'
    });
  } catch (error) {
    console.error('Add word error:', error);
    res.status(500).json({
      success: false,
      message: '添加失败，请重试'
    });
  }
});

router.get('/list', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const words = db.prepare(`
      SELECT * FROM word_books 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(req.user.id, limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM word_books WHERE user_id = ?').get(req.user.id).count;

    res.json({
      success: true,
      data: { words, total }
    });
  } catch (error) {
    console.error('Get word list error:', error);
    res.status(500).json({
      success: false,
      message: '获取单词列表失败'
    });
  }
});

router.delete('/:id', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const result = db.prepare('DELETE FROM word_books WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '单词不存在'
      });
    }

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('Delete word error:', error);
    res.status(500).json({
      success: false,
      message: '删除失败，请重试'
    });
  }
});

module.exports = router;
