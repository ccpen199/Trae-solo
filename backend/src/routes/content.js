const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { optionalAuth, isVip } = require('../middleware/auth');

const calculatePrice = (product, user) => {
  let displayPrice = product.original_price;
  
  const userIsVip = isVip(user);

  if (product.activity_price !== null && product.activity_price !== undefined) {
    displayPrice = product.activity_price;
  } else if (userIsVip && product.member_price !== null && product.member_price !== undefined) {
    displayPrice = product.member_price;
  }

  return displayPrice;
};

router.get('/', optionalAuth, (req, res) => {
  const { page = 1, pageSize = 10, category } = req.query;
  const db = getDb();

  let whereClause = 'status = 1';
  let params = [];

  if (category) {
    whereClause += ' AND category = ?';
    params.push(category);
  }

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM contents WHERE ${whereClause}`).get(...params).count;

  const contents = db.prepare(`
    SELECT * FROM contents 
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    success: true,
    data: contents.map(c => ({
      id: c.id,
      title: c.title,
      cover: c.cover,
      summary: c.summary,
      category: c.category,
      author: c.author,
      view_count: c.view_count,
      like_count: c.like_count,
      created_at: c.created_at
    })),
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
});

router.get('/categories', (req, res) => {
  const db = getDb();
  
  const categories = db.prepare(`
    SELECT DISTINCT category FROM contents 
    WHERE status = 1 AND category IS NOT NULL
    ORDER BY category
  `).all();

  res.json({
    success: true,
    data: categories.map(c => c.category)
  });
});

router.get('/:contentId', optionalAuth, (req, res) => {
  const { contentId } = req.params;
  const db = getDb();
  const user = req.user;

  const content = db.prepare('SELECT * FROM contents WHERE id = ? AND status = 1').get(contentId);

  if (!content) {
    return res.status(404).json({ error: '内容不存在' });
  }

  db.prepare('UPDATE contents SET view_count = view_count + 1 WHERE id = ?').run(contentId);

  const relatedProducts = db.prepare(`
    SELECT p.* FROM products p
    JOIN content_products cp ON p.id = cp.product_id
    WHERE cp.content_id = ? AND p.is_on_sale = 1 AND p.stock > 0
    ORDER BY cp.sort_order ASC
  `).all(contentId);

  res.json({
    success: true,
    data: {
      id: content.id,
      title: content.title,
      cover: content.cover,
      summary: content.summary,
      content: content.content,
      category: content.category,
      author: content.author,
      view_count: content.view_count + 1,
      like_count: content.like_count,
      created_at: content.created_at,
      related_products: relatedProducts.map(p => ({
        id: p.id,
        name: p.name,
        subtitle: p.subtitle,
        original_price: p.original_price,
        display_price: calculatePrice(p, user),
        member_price: p.member_price,
        activity_price: p.activity_price,
        stock: p.stock,
        images: p.images,
        can_buy: p.is_on_sale === 1 && p.stock > 0
      }))
    }
  });
});

router.post('/:contentId/like', optionalAuth, (req, res) => {
  const { contentId } = req.params;
  const db = getDb();

  const content = db.prepare('SELECT * FROM contents WHERE id = ? AND status = 1').get(contentId);

  if (!content) {
    return res.status(404).json({ error: '内容不存在' });
  }

  db.prepare('UPDATE contents SET like_count = like_count + 1 WHERE id = ?').run(contentId);

  const updatedContent = db.prepare('SELECT like_count FROM contents WHERE id = ?').get(contentId);

  res.json({
    success: true,
    data: {
      like_count: updatedContent.like_count
    }
  });
});

module.exports = router;
