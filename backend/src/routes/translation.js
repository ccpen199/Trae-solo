const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { translateText, detectLanguage } = require('../services/translationService');

router.post('/', (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '请输入要翻译的内容'
      });
    }

    const result = translateText(text);

    if (req.user) {
      const insertStmt = db.prepare(`
        INSERT INTO translations (user_id, source_text, target_text, source_lang, target_lang, translation_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run(req.user.id, result.source_text, result.target_text, result.source_lang, result.target_lang, 'text');
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      message: '翻译失败，请重试'
    });
  }
});

router.post('/photo', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        source_text: '(拍照翻译功能模拟) Hello World',
        target_text: '你好，世界',
        source_lang: 'en',
        target_lang: 'zh'
      }
    });
  } catch (error) {
    console.error('Photo translation error:', error);
    res.status(500).json({
      success: false,
      message: '拍照翻译失败，请重试'
    });
  }
});

router.get('/history', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const history = db.prepare(`
      SELECT * FROM translations 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(req.user.id, limit, offset);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get translation history error:', error);
    res.status(500).json({
      success: false,
      message: '获取历史记录失败'
    });
  }
});

module.exports = router;
