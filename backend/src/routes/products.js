const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { optionalAuth, isVip } = require('../middleware/auth');

const calculatePrice = (product, user) => {
  let displayPrice = product.original_price;
  let priceType = 'original';

  const userIsVip = isVip(user);

  if (product.activity_price !== null && product.activity_price !== undefined) {
    displayPrice = product.activity_price;
    priceType = 'activity';
  } else if (userIsVip && product.member_price !== null && product.member_price !== undefined) {
    displayPrice = product.member_price;
    priceType = 'member';
  }

  return {
    original_price: product.original_price,
    display_price: displayPrice,
    member_price: product.member_price,
    activity_price: product.activity_price,
    price_type: priceType
  };
};

const formatProduct = (product, user) => {
  const prices = calculatePrice(product, user);
  return {
    id: product.id,
    name: product.name,
    subtitle: product.subtitle,
    category_id: product.category_id,
    ...prices,
    stock: product.stock,
    sales_count: product.sales_count,
    images: product.images,
    is_on_sale: product.is_on_sale,
    is_new: product.is_new,
    is_hot: product.is_hot,
    brand: product.brand,
    supplier: product.supplier,
    can_buy: product.is_on_sale === 1 && product.stock > 0,
    stock_warning: product.stock <= 10 ? product.stock : null
  };
};

router.get('/', optionalAuth, (req, res) => {
  const { 
    page = 1, 
    pageSize = 20, 
    categoryId, 
    keyword, 
    isNew, 
    isHot, 
    onSale,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;
  
  const db = getDb();
  const user = req.user;
  
  let whereClause = ['1=1'];
  let params = [];
  
  if (categoryId) {
    whereClause.push('category_id = ?');
    params.push(categoryId);
  }
  
  if (keyword) {
    whereClause.push('(name LIKE ? OR subtitle LIKE ? OR brand LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  
  if (isNew === '1') {
    whereClause.push('is_new = 1');
  }
  
  if (isHot === '1') {
    whereClause.push('is_hot = 1');
  }
  
  if (onSale !== undefined) {
    whereClause.push('is_on_sale = ?');
    params.push(onSale === '1' ? 1 : 0);
  }

  const validSortColumns = ['created_at', 'original_price', 'sales_count', 'stock'];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const sortDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  
  const whereSql = whereClause.join(' AND ');
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM products WHERE ${whereSql}`).get(...params).count;
  
  const products = db.prepare(`
    SELECT * FROM products 
    WHERE ${whereSql}
    ORDER BY ${sortColumn} ${sortDir}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  res.json({
    success: true,
    data: products.map(p => formatProduct(p, user)),
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
});

router.get('/search', optionalAuth, (req, res) => {
  const { keyword, page = 1, pageSize = 20 } = req.query;
  const user = req.user;
  
  if (!keyword) {
    return res.status(400).json({ error: '请输入搜索关键词' });
  }
  
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM products 
    WHERE (name LIKE ? OR subtitle LIKE ? OR brand LIKE ?) AND is_on_sale = 1
  `).get(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`).count;
  
  const products = db.prepare(`
    SELECT * FROM products 
    WHERE (name LIKE ? OR subtitle LIKE ? OR brand LIKE ?) AND is_on_sale = 1
    ORDER BY sales_count DESC, created_at DESC
    LIMIT ? OFFSET ?
  `).all(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, parseInt(pageSize), offset);
  
  res.json({
    success: true,
    data: products.map(p => formatProduct(p, user)),
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
});

router.get('/new', optionalAuth, (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const user = req.user;
  
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM products WHERE is_new = 1 AND is_on_sale = 1`).get().count;
  
  const products = db.prepare(`
    SELECT * FROM products 
    WHERE is_new = 1 AND is_on_sale = 1
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(pageSize), offset);
  
  res.json({
    success: true,
    data: products.map(p => formatProduct(p, user)),
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
});

router.get('/hot', optionalAuth, (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const user = req.user;
  
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM products WHERE is_hot = 1 AND is_on_sale = 1`).get().count;
  
  const products = db.prepare(`
    SELECT * FROM products 
    WHERE is_hot = 1 AND is_on_sale = 1
    ORDER BY sales_count DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(pageSize), offset);
  
  res.json({
    success: true,
    data: products.map(p => formatProduct(p, user)),
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
});

router.get('/recommend', optionalAuth, (req, res) => {
  const { limit = 10 } = req.query;
  const user = req.user;
  
  const db = getDb();
  
  const products = db.prepare(`
    SELECT * FROM products 
    WHERE is_on_sale = 1 AND stock > 0
    ORDER BY is_hot DESC, sales_count DESC, created_at DESC
    LIMIT ?
  `).all(parseInt(limit));
  
  res.json({
    success: true,
    data: products.map(p => formatProduct(p, user))
  });
});

router.get('/guess-like', optionalAuth, (req, res) => {
  const { limit = 10 } = req.query;
  const user = req.user;
  
  const db = getDb();
  
  const products = db.prepare(`
    SELECT * FROM products 
    WHERE is_on_sale = 1 AND stock > 0
    ORDER BY RANDOM()
    LIMIT ?
  `).all(parseInt(limit));
  
  res.json({
    success: true,
    data: products.map(p => formatProduct(p, user))
  });
});

router.get('/brand-direct', optionalAuth, (req, res) => {
  const { limit = 10 } = req.query;
  const user = req.user;
  
  const db = getDb();
  
  const products = db.prepare(`
    SELECT * FROM products 
    WHERE is_on_sale = 1 AND stock > 0 AND brand IS NOT NULL
    ORDER BY sales_count DESC
    LIMIT ?
  `).all(parseInt(limit));
  
  res.json({
    success: true,
    data: products.map(p => formatProduct(p, user))
  });
});

router.get('/:id', optionalAuth, (req, res) => {
  const { id } = req.params;
  const user = req.user;
  
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }
  
  const specs = db.prepare('SELECT * FROM product_specs WHERE product_id = ?').all(id);
  const comments = db.prepare(`
    SELECT c.*, u.nickname, u.avatar 
    FROM comments c 
    LEFT JOIN users u ON c.user_id = u.id 
    WHERE c.product_id = ? AND c.status = 1
    ORDER BY c.created_at DESC
    LIMIT 10
  `).all(id);
  
  res.json({
    success: true,
    data: {
      ...formatProduct(product, user),
      description: product.description,
      specs,
      comments: comments.map(c => ({
        id: c.id,
        user: {
          nickname: c.nickname,
          avatar: c.avatar
        },
        rating: c.rating,
        content: c.content,
        images: c.images,
        created_at: c.created_at
      }))
    }
  });
});

router.get('/supplier/:supplier', optionalAuth, (req, res) => {
  const { supplier } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  const user = req.user;
  
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM products WHERE supplier = ? AND is_on_sale = 1`).get(supplier).count;
  
  const products = db.prepare(`
    SELECT * FROM products 
    WHERE supplier = ? AND is_on_sale = 1
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(supplier, parseInt(pageSize), offset);
  
  res.json({
    success: true,
    data: {
      supplier,
      products: products.map(p => formatProduct(p, user))
    },
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
});

module.exports = router;
