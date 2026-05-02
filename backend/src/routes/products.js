const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const auditService = require('../services/audit.service');
const imageOCRService = require('../services/image-ocr.service');
const trustLinkService = require('../services/trust-link.service');

router.get('/', optionalAuth, (req, res) => {
  const { 
    keyword = '', 
    category, 
    brand, 
    minPrice, 
    maxPrice, 
    condition,
    sort = 'newest',
    page = 1,
    limit = 20
  } = req.query;

  const offset = (page - 1) * limit;
  
  let whereConditions = ['p.status = ?'];
  let whereParams = ['on_sale'];

  if (keyword) {
    whereConditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)');
    const keywordPattern = `%${keyword}%`;
    whereParams.push(keywordPattern, keywordPattern, keywordPattern);
  }

  if (category) {
    whereConditions.push('p.category = ?');
    whereParams.push(category);
  }

  if (brand) {
    whereConditions.push('p.brand = ?');
    whereParams.push(brand);
  }

  if (minPrice) {
    whereConditions.push('p.price >= ?');
    whereParams.push(parseFloat(minPrice));
  }

  if (maxPrice) {
    whereConditions.push('p.price <= ?');
    whereParams.push(parseFloat(maxPrice));
  }

  if (condition) {
    whereConditions.push('p.condition = ?');
    whereParams.push(condition);
  }

  let orderBy = 'p.created_at DESC';
  switch (sort) {
    case 'price_asc':
      orderBy = 'p.price ASC';
      break;
    case 'price_desc':
      orderBy = 'p.price DESC';
      break;
    case 'popular':
      orderBy = 'p.view_count DESC';
      break;
    default:
      orderBy = 'p.created_at DESC';
  }

  const countSql = `SELECT COUNT(*) as total FROM products p WHERE ${whereConditions.join(' AND ')}`;
  const countResult = db.prepare(countSql).get(...whereParams);
  const total = countResult.total;

  const sql = `
    SELECT 
      p.*,
      u.nickname as seller_nickname,
      u.avatar as seller_avatar,
      u.trust_score as seller_trust_score,
      u.trust_level as seller_trust_level
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const products = db.prepare(sql).all(...whereParams, parseInt(limit), offset);

  const formattedProducts = products.map(p => ({
    ...p,
    images: p.images ? JSON.parse(p.images) : [],
    ocrResult: p.ocr_result ? JSON.parse(p.ocr_result) : null,
    isFavorite: req.user ? !!db.prepare(
      'SELECT 1 FROM favorites WHERE user_id = ? AND product_id = ?'
    ).get(req.user.id, p.id) : false
  }));

  res.json({
    success: true,
    data: {
      products: formattedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

router.get('/categories', (req, res) => {
  const categories = imageOCRService.getAllCategories();
  
  const categoryStats = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM products
    WHERE status = 'on_sale'
    GROUP BY category
  `).all();

  const statsMap = {};
  categoryStats.forEach(s => {
    statsMap[s.category] = s.count;
  });

  const result = categories.map(cat => ({
    name: cat,
    count: statsMap[cat] || 0
  }));

  res.json({
    success: true,
    data: result
  });
});

router.get('/brands', (req, res) => {
  const { category } = req.query;
  
  let sql = `
    SELECT brand, COUNT(*) as count
    FROM products
    WHERE status = 'on_sale'
  `;
  const params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' GROUP BY brand HAVING COUNT(*) > 0 ORDER BY count DESC';

  const brands = db.prepare(sql).all(...params);

  res.json({
    success: true,
    data: brands
  });
});

router.get('/my', authenticateToken, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const userId = req.user.id;
  const offset = (page - 1) * limit;

  let whereConditions = ['seller_id = ?'];
  let whereParams = [userId];

  if (status) {
    whereConditions.push('status = ?');
    whereParams.push(status);
  }

  const countSql = `SELECT COUNT(*) as total FROM products WHERE ${whereConditions.join(' AND ')}`;
  const countResult = db.prepare(countSql).get(...whereParams);
  const total = countResult.total;

  const sql = `
    SELECT * FROM products 
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  const products = db.prepare(sql).all(...whereParams, parseInt(limit), offset);

  const formattedProducts = products.map(p => ({
    ...p,
    images: p.images ? JSON.parse(p.images) : [],
    ocrResult: p.ocr_result ? JSON.parse(p.ocr_result) : null
  }));

  res.json({
    success: true,
    data: {
      products: formattedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

router.get('/:id', optionalAuth, (req, res) => {
  const productId = req.params.id;

  const product = db.prepare(`
    SELECT 
      p.*,
      u.nickname as seller_nickname,
      u.avatar as seller_avatar,
      u.trust_score as seller_trust_score,
      u.trust_level as seller_trust_level
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.id = ?
  `).get(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: '商品不存在'
    });
  }

  db.prepare('UPDATE products SET view_count = view_count + 1 WHERE id = ?').run(productId);

  const formattedProduct = {
    ...product,
    images: product.images ? JSON.parse(product.images) : [],
    ocrResult: product.ocr_result ? JSON.parse(product.ocr_result) : null,
    isFavorite: req.user ? !!db.prepare(
      'SELECT 1 FROM favorites WHERE user_id = ? AND product_id = ?'
    ).get(req.user.id, productId) : false
  };

  auditService.logQuery({
    module: auditService.MODULES.PRODUCT,
    resourceType: 'product',
    resourceId: productId,
    description: `查看商品: ${product.title}`
  });

  res.json({
    success: true,
    data: formattedProduct
  });
});

router.post('/', authenticateToken, requireRole('seller', 'admin'), (req, res) => {
  const {
    title,
    description,
    price,
    originalPrice,
    category,
    brand,
    model,
    condition,
    images = [],
    location,
    isExpressDelivery = 0,
    isSelfPickup = 0
  } = req.body;

  const userId = req.user.id;

  if (!title || !price) {
    return res.status(400).json({
      success: false,
      message: '标题和价格不能为空'
    });
  }

  const insertStmt = db.prepare(`
    INSERT INTO products (
      seller_id, title, description, price, original_price,
      category, brand, model, condition, images,
      location, is_express_delivery, is_self_pickup, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    userId,
    title,
    description || null,
    parseFloat(price),
    originalPrice ? parseFloat(originalPrice) : null,
    category || null,
    brand || null,
    model || null,
    condition || 'good',
    JSON.stringify(images),
    location || null,
    isExpressDelivery ? 1 : 0,
    isSelfPickup ? 1 : 0,
    'pending_review'
  );

  const productId = result.lastInsertRowid;

  imageOCRService.analyzeProduct(productId, '', req.user);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

  auditService.logCreate({
    user: req.user,
    module: auditService.MODULES.PRODUCT,
    resourceType: 'product',
    resourceId: productId,
    newValue: { title, price, brand, category },
    description: `创建商品: ${title}`
  });

  res.json({
    success: true,
    message: '商品已提交审核',
    data: {
      ...product,
      images: product.images ? JSON.parse(product.images) : []
    }
  });
});

router.put('/:id', authenticateToken, (req, res) => {
  const productId = req.params.id;
  const userId = req.user.id;
  const {
    title,
    description,
    price,
    originalPrice,
    category,
    brand,
    model,
    condition,
    images,
    location,
    isExpressDelivery,
    isSelfPickup
  } = req.body;

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: '商品不存在'
    });
  }

  if (product.seller_id !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '无权限编辑此商品'
    });
  }

  const updateFields = [];
  const updateValues = [];

  if (title !== undefined) {
    updateFields.push('title = ?');
    updateValues.push(title);
  }
  if (description !== undefined) {
    updateFields.push('description = ?');
    updateValues.push(description);
  }
  if (price !== undefined) {
    updateFields.push('price = ?');
    updateValues.push(parseFloat(price));
  }
  if (originalPrice !== undefined) {
    updateFields.push('original_price = ?');
    updateValues.push(originalPrice ? parseFloat(originalPrice) : null);
  }
  if (category !== undefined) {
    updateFields.push('category = ?');
    updateValues.push(category);
  }
  if (brand !== undefined) {
    updateFields.push('brand = ?');
    updateValues.push(brand);
  }
  if (model !== undefined) {
    updateFields.push('model = ?');
    updateValues.push(model);
  }
  if (condition !== undefined) {
    updateFields.push('condition = ?');
    updateValues.push(condition);
  }
  if (images !== undefined) {
    updateFields.push('images = ?');
    updateValues.push(JSON.stringify(images));
  }
  if (location !== undefined) {
    updateFields.push('location = ?');
    updateValues.push(location);
  }
  if (isExpressDelivery !== undefined) {
    updateFields.push('is_express_delivery = ?');
    updateValues.push(isExpressDelivery ? 1 : 0);
  }
  if (isSelfPickup !== undefined) {
    updateFields.push('is_self_pickup = ?');
    updateValues.push(isSelfPickup ? 1 : 0);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      message: '没有需要更新的字段'
    });
  }

  updateFields.push('status = ?');
  updateValues.push('pending_review');
  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  updateValues.push(productId);

  const oldValue = {
    title: product.title,
    price: product.price,
    status: product.status
  };

  const sql = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...updateValues);

  imageOCRService.analyzeProduct(productId, '', req.user);

  auditService.logUpdate({
    user: req.user,
    module: auditService.MODULES.PRODUCT,
    resourceType: 'product',
    resourceId: productId,
    oldValue,
    newValue: { title, price, status: 'pending_review' },
    description: `更新商品: ${product.title}`
  });

  res.json({
    success: true,
    message: '商品已更新，重新提交审核'
  });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const productId = req.params.id;
  const userId = req.user.id;

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: '商品不存在'
    });
  }

  if (product.seller_id !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '无权限删除此商品'
    });
  }

  db.prepare(`
    UPDATE products 
    SET status = 'removed', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(productId);

  auditService.logDelete({
    user: req.user,
    module: auditService.MODULES.PRODUCT,
    resourceType: 'product',
    resourceId: productId,
    oldValue: { title: product.title, status: product.status },
    description: `下架商品: ${product.title}`
  });

  res.json({
    success: true,
    message: '商品已下架'
  });
});

router.put('/:id/favorite', authenticateToken, (req, res) => {
  const productId = req.params.id;
  const userId = req.user.id;

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = ?').get(productId, 'on_sale');
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: '商品不存在或已下架'
    });
  }

  const existingFavorite = db.prepare(
    'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?'
  ).get(userId, productId);

  if (existingFavorite) {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(userId, productId);
    db.prepare('UPDATE products SET favorite_count = favorite_count - 1 WHERE id = ?').run(productId);
    
    res.json({
      success: true,
      data: { isFavorite: false }
    });
  } else {
    db.prepare('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)').run(userId, productId);
    db.prepare('UPDATE products SET favorite_count = favorite_count + 1 WHERE id = ?').run(productId);
    
    res.json({
      success: true,
      data: { isFavorite: true }
    });
  }
});

router.get('/favorites/list', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const countSql = `
    SELECT COUNT(*) as total 
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    WHERE f.user_id = ? AND p.status = 'on_sale'
  `;
  const countResult = db.prepare(countSql).get(userId);
  const total = countResult.total;

  const sql = `
    SELECT 
      p.*,
      u.nickname as seller_nickname,
      f.created_at as favorited_at
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE f.user_id = ? AND p.status = 'on_sale'
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const products = db.prepare(sql).all(userId, parseInt(limit), offset);

  const formattedProducts = products.map(p => ({
    ...p,
    images: p.images ? JSON.parse(p.images) : [],
    isFavorite: true
  }));

  res.json({
    success: true,
    data: {
      products: formattedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

module.exports = router;
