const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  try {
    const { difficulty } = req.query;
    
    let query = 'SELECT * FROM stories WHERE status = ?';
    const params = ['approved'];

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const stories = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: stories
    });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({
      success: false,
      message: '获取故事列表失败'
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(id);
    
    if (!story) {
      return res.status(404).json({
        success: false,
        message: '故事不存在'
      });
    }

    res.json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({
      success: false,
      message: '获取故事详情失败'
    });
  }
});

module.exports = router;
