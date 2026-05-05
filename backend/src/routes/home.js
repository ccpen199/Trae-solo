const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { optionalAuthMiddleware } = require('../middleware/auth');

router.get('/banners', (req, res) => {
  const banners = db.prepare(
    'SELECT * FROM banners WHERE status = 1 ORDER BY sort_order'
  ).all();
  
  res.json({ code: 0, data: banners });
});

router.get('/categories', (req, res) => {
  const categories = db.prepare(
    'SELECT * FROM categories ORDER BY sort_order'
  ).all();
  
  res.json({ code: 0, data: categories });
});

router.get('/activity-tags', (req, res) => {
  const tags = db.prepare(
    'SELECT * FROM activity_tags ORDER BY sort_order'
  ).all();
  
  res.json({ code: 0, data: tags });
});

router.get('/hot-products', optionalAuthMiddleware, (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const isVip = req.user?.is_vip === 1;
  
  const products = db.prepare(`
    SELECT 
      id, name, description, price, 
      ${isVip ? 'vip_price as show_price' : 'price as show_price'},
      original_price, image, category_id, stock, sales, is_hot, unit, spec
    FROM products 
    WHERE is_hot = 1 AND stock > 0 
    ORDER BY sales DESC 
    LIMIT ?
  `).all(limit);
  
  res.json({ code: 0, data: products });
});

router.get('/new-products', optionalAuthMiddleware, (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const isVip = req.user?.is_vip === 1;
  
  const products = db.prepare(`
    SELECT 
      id, name, description, price, 
      ${isVip ? 'vip_price as show_price' : 'price as show_price'},
      original_price, image, category_id, stock, sales, is_new, unit, spec
    FROM products 
    WHERE is_new = 1 AND stock > 0 
    ORDER BY created_at DESC 
    LIMIT ?
  `).all(limit);
  
  res.json({ code: 0, data: products });
});

router.get('/category-products/:categoryId', optionalAuthMiddleware, (req, res) => {
  const { categoryId } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const isVip = req.user?.is_vip === 1;
  
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId);
  
  if (!category) {
    return res.status(404).json({ code: 404, message: '分类不存在' });
  }
  
  const products = db.prepare(`
    SELECT 
      id, name, description, price, 
      ${isVip ? 'vip_price as show_price' : 'price as show_price'},
      original_price, image, category_id, stock, sales, is_hot, unit, spec
    FROM products 
    WHERE category_id = ?
    ORDER BY sales DESC 
    LIMIT ? OFFSET ?
  `).all(categoryId, limit, offset);
  
  const total = db.prepare(
    'SELECT COUNT(*) as count FROM products WHERE category_id = ?'
  ).get(categoryId).count;
  
  res.json({
    code: 0,
    data: {
      category,
      products,
      total,
      hasMore: offset + limit < total
    }
  });
});

router.get('/seckill-products', optionalAuthMiddleware, (req, res) => {
  const isVip = req.user?.is_vip === 1;
  const now = new Date().toISOString();
  
  const products = db.prepare(`
    SELECT 
      id, name, description, price, seckill_price,
      ${isVip ? 'vip_price as show_price' : 'price as show_price'},
      original_price, image, category_id, stock, sales, 
      seckill_start_time, seckill_end_time, unit, spec
    FROM products 
    WHERE is_seckill = 1 
      AND stock > 0
      AND (seckill_start_time IS NULL OR seckill_start_time <= datetime('now'))
      AND (seckill_end_time IS NULL OR seckill_end_time > datetime('now'))
    ORDER BY sales DESC
  `).all();
  
  res.json({ code: 0, data: products });
});

module.exports = router;
