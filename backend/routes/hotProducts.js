const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { category, search, sort, page = 1, limit = 20 } = req.query;
  
  let query = `SELECT * FROM hot_products WHERE 1=1`;
  const params = [];
  
  if (category && category !== 'all') {
    query += ` AND category = ?`;
    params.push(category);
  }
  
  if (search) {
    query += ` AND (name LIKE ? OR brand LIKE ? OR tags LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (sort === 'price_low') {
    query += ` ORDER BY avg_price_min ASC`;
  } else if (sort === 'price_high') {
    query += ` ORDER BY avg_price_max DESC`;
  } else {
    query += ` ORDER BY popularity_score DESC`;
  }
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);
  
  const products = db.prepare(query).all(...params);
  
  let countQuery = `SELECT COUNT(*) as total FROM hot_products WHERE 1=1`;
  const countParams = [];
  
  if (category && category !== 'all') {
    countQuery += ` AND category = ?`;
    countParams.push(category);
  }
  
  if (search) {
    countQuery += ` AND (name LIKE ? OR brand LIKE ? OR tags LIKE ?)`;
    const searchTerm = `%${search}%`;
    countParams.push(searchTerm, searchTerm, searchTerm);
  }
  
  const totalResult = db.prepare(countQuery).get(...countParams);
  const total = totalResult.total;
  const totalPages = Math.ceil(total / parseInt(limit));
  
  res.json({
    products,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: total,
      itemsPerPage: parseInt(limit)
    }
  });
});

router.get('/categories', (req, res) => {
  const categories = db.prepare(`
    SELECT category, COUNT(*) as count 
    FROM hot_products 
    GROUP BY category 
    ORDER BY count DESC
  `).all();
  
  res.json(categories);
});

router.get('/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_products,
      COUNT(CASE WHEN is_imported = 1 THEN 1 END) as imported_products,
      MIN(avg_price_min) as min_price,
      MAX(avg_price_max) as max_price,
      AVG((avg_price_min + avg_price_max) / 2) as avg_price
    FROM hot_products
  `).get();
  
  const categoryStats = db.prepare(`
    SELECT category, COUNT(*) as count,
           MIN(avg_price_min) as min_price,
           MAX(avg_price_max) as max_price
    FROM hot_products
    GROUP BY category
    ORDER BY count DESC
  `).all();
  
  res.json({
    overview: stats,
    byCategory: categoryStats
  });
});

router.get('/:id', (req, res) => {
  const product = db.prepare(`
    SELECT * FROM hot_products WHERE id = ?
  `).get(req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Hot product not found' });
  }
  
  res.json(product);
});

router.post('/import', (req, res) => {
  const { hotProductId, competitor_id, current_price, product_url, stock_status } = req.body;
  
  if (!hotProductId || !competitor_id) {
    return res.status(400).json({ error: 'Hot product ID and competitor ID are required' });
  }
  
  const hotProduct = db.prepare(`
    SELECT * FROM hot_products WHERE id = ?
  `).get(hotProductId);
  
  if (!hotProduct) {
    return res.status(404).json({ error: 'Hot product not found' });
  }
  
  const competitor = db.prepare(`
    SELECT * FROM competitors WHERE id = ?
  `).get(competitor_id);
  
  if (!competitor) {
    return res.status(404).json({ error: 'Competitor not found' });
  }
  
  const price = current_price || ((hotProduct.avg_price_min + hotProduct.avg_price_max) / 2);
  
  const existingProduct = db.prepare(`
    SELECT * FROM product_prices 
    WHERE competitor_id = ? AND product_name = ?
  `).get(competitor_id, hotProduct.name);
  
  if (existingProduct) {
    return res.status(400).json({ error: 'Product already exists for this competitor' });
  }
  
  const result = db.prepare(`
    INSERT INTO product_prices (competitor_id, product_name, product_url, current_price, original_price, currency, stock_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    competitor_id,
    hotProduct.name,
    product_url || '',
    price,
    hotProduct.avg_price_max || price,
    'USD',
    stock_status || 'In Stock'
  );
  
  db.prepare(`
    UPDATE hot_products SET is_imported = 1 WHERE id = ?
  `).run(hotProductId);
  
  const newProduct = db.prepare(`
    SELECT p.*, c.name as competitor_name, c.platform
    FROM product_prices p
    JOIN competitors c ON p.competitor_id = c.id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);
  
  res.status(201).json({
    message: 'Product imported successfully',
    product: newProduct,
    hotProduct: hotProduct
  });
});

router.post('/import-batch', (req, res) => {
  const { productIds, competitor_id, default_stock } = req.body;
  
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: 'Product IDs array is required' });
  }
  
  if (!competitor_id) {
    return res.status(400).json({ error: 'Competitor ID is required' });
  }
  
  const competitor = db.prepare(`
    SELECT * FROM competitors WHERE id = ?
  `).get(competitor_id);
  
  if (!competitor) {
    return res.status(404).json({ error: 'Competitor not found' });
  }
  
  const results = {
    success: [],
    failed: [],
    alreadyExists: []
  };
  
  const placeholders = productIds.map(() => '?').join(',');
  const hotProducts = db.prepare(`
    SELECT * FROM hot_products WHERE id IN (${placeholders})
  `).all(...productIds);
  
  db.transaction(() => {
    hotProducts.forEach(hotProduct => {
      const existingProduct = db.prepare(`
        SELECT * FROM product_prices 
        WHERE competitor_id = ? AND product_name = ?
      `).get(competitor_id, hotProduct.name);
      
      if (existingProduct) {
        results.alreadyExists.push({
          id: hotProduct.id,
          name: hotProduct.name,
          reason: 'Product already exists'
        });
        return;
      }
      
      try {
        const price = (hotProduct.avg_price_min + hotProduct.avg_price_max) / 2;
        
        const result = db.prepare(`
          INSERT INTO product_prices (competitor_id, product_name, product_url, current_price, original_price, currency, stock_status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          competitor_id,
          hotProduct.name,
          '',
          price,
          hotProduct.avg_price_max || price,
          'USD',
          default_stock || 'In Stock'
        );
        
        db.prepare(`
          UPDATE hot_products SET is_imported = 1 WHERE id = ?
        `).run(hotProduct.id);
        
        results.success.push({
          id: hotProduct.id,
          name: hotProduct.name,
          productPriceId: result.lastInsertRowid
        });
      } catch (error) {
        results.failed.push({
          id: hotProduct.id,
          name: hotProduct.name,
          reason: error.message
        });
      }
    });
  })();
  
  res.json({
    message: 'Batch import completed',
    summary: {
      total: productIds.length,
      success: results.success.length,
      failed: results.failed.length,
      alreadyExists: results.alreadyExists.length
    },
    details: results
  });
});

router.get('/popular/top100', (req, res) => {
  const products = db.prepare(`
    SELECT * FROM hot_products 
    ORDER BY popularity_score DESC 
    LIMIT 100
  `).all();
  
  res.json({
    total: products.length,
    products
  });
});

router.get('/popular/by-category', (req, res) => {
  const { limit = 10 } = req.query;
  
  const categories = db.prepare(`
    SELECT DISTINCT category FROM hot_products
  `).all();
  
  const result = {};
  
  categories.forEach(cat => {
    const products = db.prepare(`
      SELECT * FROM hot_products 
      WHERE category = ? 
      ORDER BY popularity_score DESC 
      LIMIT ?
    `).all(cat.category, parseInt(limit));
    
    result[cat.category] = products;
  });
  
  res.json(result);
});

module.exports = router;
