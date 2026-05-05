const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

router.get('/hot', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const hotSearches = db.prepare(
    'SELECT * FROM hot_searches ORDER BY sort_order, search_count DESC LIMIT ?'
  ).all(limit);
  
  res.json({ code: 0, data: hotSearches });
});

router.get('/history', authMiddleware, (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const histories = db.prepare(
    'SELECT keyword FROM search_histories WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?'
  ).all(req.user.id, limit);
  
  res.json({ code: 0, data: histories.map(h => h.keyword) });
});

router.delete('/history', authMiddleware, (req, res) => {
  const { keyword } = req.body;
  
  if (keyword) {
    db.prepare('DELETE FROM search_histories WHERE user_id = ? AND keyword = ?')
      .run(req.user.id, keyword);
  } else {
    db.prepare('DELETE FROM search_histories WHERE user_id = ?')
      .run(req.user.id);
  }
  
  res.json({ code: 0, message: '删除成功' });
});

router.get('/', optionalAuthMiddleware, (req, res) => {
  const { keyword } = req.query;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const isVip = req.user?.is_vip === 1;
  
  if (!keyword || keyword.trim() === '') {
    return res.status(400).json({ code: 400, message: '请输入搜索关键词' });
  }
  
  if (req.user) {
    const existing = db.prepare(
      'SELECT * FROM search_histories WHERE user_id = ? AND keyword = ?'
    ).get(req.user.id, keyword);
    
    if (existing) {
      db.prepare(
        'UPDATE search_histories SET search_count = search_count + 1, updated_at = datetime("now") WHERE user_id = ? AND keyword = ?'
      ).run(req.user.id, keyword);
    } else {
      db.prepare(
        'INSERT INTO search_histories (user_id, keyword) VALUES (?, ?)'
      ).run(req.user.id, keyword);
    }
  }
  
  const searchKeyword = `%${keyword}%`;
  
  const products = db.prepare(`
    SELECT 
      id, name, description, price, 
      ${isVip ? 'vip_price as show_price' : 'price as show_price'},
      original_price, image, category_id, stock, sales, is_hot, unit, spec
    FROM products 
    WHERE name LIKE ? OR description LIKE ?
    ORDER BY sales DESC 
    LIMIT ? OFFSET ?
  `).all(searchKeyword, searchKeyword, limit, offset);
  
  const total = db.prepare(
    'SELECT COUNT(*) as count FROM products WHERE name LIKE ? OR description LIKE ?'
  ).get(searchKeyword, searchKeyword).count;
  
  res.json({
    code: 0,
    data: {
      keyword,
      products,
      total,
      hasMore: offset + limit < total
    }
  });
});

module.exports = router;
