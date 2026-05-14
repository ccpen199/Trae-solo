const express = require('express');
const db = require('../database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', (req, res) => {
  const parentId = req.query.parent_id || 0;
  
  const categories = db.prepare(`
    SELECT id, name, icon, sort_order 
    FROM categories 
    WHERE parent_id = ? 
    ORDER BY sort_order ASC, id ASC
  `).all(parentId);
  
  const withChildren = categories.map(cat => {
    const children = db.prepare(`
      SELECT id, name, icon, sort_order 
      FROM categories 
      WHERE parent_id = ? 
      ORDER BY sort_order ASC, id ASC
    `).all(cat.id);
    
    return {
      ...cat,
      children
    };
  });
  
  res.json({ categories: withChildren });
});

router.get('/home-recommend', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const products = db.prepare(`
    SELECT id, name, price, original_price, images, sales, is_hot, is_recommend
    FROM products 
    WHERE status = 1 
    ORDER BY is_recommend DESC, sales DESC 
    LIMIT ?
  `).all(limit);
  
  const banners = [
    { id: 1, image: '/images/banners/banner1.svg', link: '/product/1' },
    { id: 2, image: '/images/banners/banner2.svg', link: '/category' },
    { id: 3, image: '/images/banners/banner3.svg', link: '/product/2' }
  ];
  
  const quickEntries = [
    { id: 1, name: '限时秒杀', icon: '/images/icons/flash-sale.svg' },
    { id: 2, name: '拼团', icon: '/images/icons/group-buy.svg' },
    { id: 3, name: '优惠券', icon: '/images/icons/coupon.svg' },
    { id: 4, name: '签到', icon: '/images/icons/checkin.svg' },
    { id: 5, name: '我的店铺', icon: '/images/icons/shop.svg' }
  ];
  
  res.json({ banners, quickEntries, products });
});

router.get('/list', (req, res) => {
  const { keyword, category_id, is_hot, is_recommend, sort = 'default', page = 1, page_size = 20 } = req.query;
  
  const offset = (page - 1) * page_size;
  
  let whereClause = 'WHERE p.status = 1';
  const params = [];
  
  if (keyword) {
    whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  if (category_id) {
    whereClause += ' AND p.category_id = ?';
    params.push(parseInt(category_id));
  }
  
  if (is_hot === '1') {
    whereClause += ' AND p.is_hot = 1';
  }
  
  if (is_recommend === '1') {
    whereClause += ' AND p.is_recommend = 1';
  }
  
  let orderBy = 'p.id DESC';
  switch (sort) {
    case 'sales':
      orderBy = 'p.sales DESC';
      break;
    case 'price_asc':
      orderBy = 'p.price ASC';
      break;
    case 'price_desc':
      orderBy = 'p.price DESC';
      break;
    case 'newest':
      orderBy = 'p.created_at DESC';
      break;
  }
  
  const countResult = db.prepare(`
    SELECT COUNT(*) as total 
    FROM products p 
    ${whereClause}
  `).get(...params);
  
  const products = db.prepare(`
    SELECT p.id, p.name, p.price, p.original_price, p.images, p.sales, p.stock
    FROM products p 
    ${whereClause} 
    ORDER BY ${orderBy} 
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(page_size), offset);
  
  res.json({
    products,
    pagination: {
      page: parseInt(page),
      page_size: parseInt(page_size),
      total: countResult.total,
      total_pages: Math.ceil(countResult.total / page_size)
    }
  });
});

router.get('/hot-selling', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const products = db.prepare(`
    SELECT id, name, price, original_price, images, sales
    FROM products 
    WHERE status = 1 
    ORDER BY sales DESC 
    LIMIT ?
  `).all(limit);
  
  res.json({ products });
});

router.get('/:id', optionalAuth, (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ? AND p.status = 1
  `).get(req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const skus = db.prepare(`
    SELECT id, sku_name, sku_value, price, stock
    FROM product_skus
    WHERE product_id = ?
  `).all(product.id);
  
  const reviews = db.prepare(`
    SELECT r.*, u.nickname, u.avatar
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
    LIMIT 10
  `).all(product.id);
  
  const relatedProducts = db.prepare(`
    SELECT id, name, price, original_price, images, sales
    FROM products 
    WHERE status = 1 AND id != ? 
    ORDER BY RANDOM() 
    LIMIT 6
  `).all(product.id);
  
  let images = [];
  try {
    images = JSON.parse(product.images);
  } catch (e) {
    images = [];
  }
  
  let detailImages = [];
  try {
    detailImages = JSON.parse(product.detail_images);
  } catch (e) {
    detailImages = [];
  }
  
  res.json({
    product: {
      ...product,
      images,
      detail_images: detailImages
    },
    skus,
    reviews,
    relatedProducts
  });
});

router.get('/:id/reviews', (req, res) => {
  const { page = 1, page_size = 10 } = req.query;
  const offset = (page - 1) * page_size;
  
  const countResult = db.prepare(`
    SELECT COUNT(*) as total FROM reviews WHERE product_id = ?
  `).get(req.params.id);
  
  const reviews = db.prepare(`
    SELECT r.*, u.nickname, u.avatar
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.params.id, parseInt(page_size), offset);
  
  res.json({
    reviews,
    pagination: {
      page: parseInt(page),
      page_size: parseInt(page_size),
      total: countResult.total,
      total_pages: Math.ceil(countResult.total / page_size)
    }
  });
});

router.get('/search/suggestions', (req, res) => {
  const { keyword } = req.query;
  
  if (!keyword || keyword.length < 1) {
    return res.json({ suggestions: [] });
  }
  
  const products = db.prepare(`
    SELECT id, name
    FROM products 
    WHERE status = 1 AND name LIKE ? 
    LIMIT 10
  `).all(`%${keyword}%`);
  
  const suggestions = products.map(p => p.name);
  
  res.json({ suggestions });
});

router.get('/search/hot-words', (req, res) => {
  const hotWords = [
    '春季新款', '连衣裙', '运动鞋', '护肤套装', 
    '口红', '笔记本', '蓝牙耳机', '零食大礼包',
    '面膜', '牛仔裤', '卫衣', '厨房用品'
  ];
  
  const guessWords = [
    '你可能还喜欢', '今日必抢', '人气爆款', '新品上市'
  ];
  
  res.json({ hotWords, guessWords });
});

module.exports = router;
