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

router.get('/', (req, res) => {
  const db = getDb();
  
  const categories = db.prepare(`
    SELECT * FROM categories 
    WHERE status = 1 
    ORDER BY sort_order ASC, id ASC
  `).all();

  const parentCategories = categories.filter(c => c.parent_id === 0);
  const childCategories = categories.filter(c => c.parent_id !== 0);

  const result = parentCategories.map(parent => ({
    ...parent,
    children: childCategories.filter(c => c.parent_id === parent.id)
  }));

  res.json({
    success: true,
    data: result
  });
});

router.get('/:categoryId/products', optionalAuth, (req, res) => {
  const { categoryId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  const db = getDb();
  const user = req.user;

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM products 
    WHERE category_id = ? AND is_on_sale = 1
  `).get(categoryId).count;

  const products = db.prepare(`
    SELECT * FROM products 
    WHERE category_id = ? AND is_on_sale = 1
    ORDER BY is_hot DESC, sales_count DESC, created_at DESC
    LIMIT ? OFFSET ?
  `).all(categoryId, parseInt(pageSize), offset);

  res.json({
    success: true,
    data: products.map(p => ({
      id: p.id,
      name: p.name,
      subtitle: p.subtitle,
      category_id: p.category_id,
      original_price: p.original_price,
      display_price: calculatePrice(p, user),
      member_price: p.member_price,
      activity_price: p.activity_price,
      stock: p.stock,
      sales_count: p.sales_count,
      images: p.images,
      is_new: p.is_new,
      is_hot: p.is_hot,
      brand: p.brand,
      can_buy: p.is_on_sale === 1 && p.stock > 0,
      stock_warning: p.stock <= 10 ? p.stock : null
    })),
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
});

module.exports = router;
