const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取分类失败' });
  }
});

router.get('/banners', (req, res) => {
  try {
    const banners = db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order').all();
    res.json({ success: true, data: banners });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取轮播图失败' });
  }
});

router.get('/topics', (req, res) => {
  try {
    const topics = db.prepare('SELECT * FROM topics ORDER BY sort_order').all();
    res.json({ success: true, data: topics });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取专题失败' });
  }
});

router.get('/hot-search', (req, res) => {
  const hotSearches = [
    { id: 1, keyword: '汉堡' },
    { id: 2, keyword: '奶茶' },
    { id: 3, keyword: '火锅' },
    { id: 4, keyword: '炸鸡' },
    { id: 5, keyword: '披萨' },
    { id: 6, keyword: '咖啡' },
    { id: 7, keyword: '早餐' },
    { id: 8, keyword: '夜宵' }
  ];
  res.json({ success: true, data: hotSearches });
});

module.exports = router;
