const express = require('express');
const router = express.Router();
const { authenticate, success, error, query, queryOne, execute } = require('../utils');

router.get('/categories', async (req, res) => {
  try {
    const categories = await query('SELECT * FROM categories WHERE status = 1 ORDER BY sort_order ASC');
    const tree = buildTree(categories);
    res.json(success(tree));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

function buildTree(categories, parentId = 0) {
  return categories
    .filter(cat => cat.parent_id === parentId)
    .map(cat => ({
      ...cat,
      children: buildTree(categories, cat.id)
    }));
}

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const categoryId = req.query.categoryId;
    const style = req.query.style;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;
    
    let sql = 'SELECT * FROM products WHERE status = 1';
    let params = [];
    
    if (categoryId) {
      sql += ' AND category_id = ?';
      params.push(categoryId);
    }
    if (style) {
      sql += ' AND style = ?';
      params.push(style);
    }
    if (minPrice) {
      sql += ' AND price >= ?';
      params.push(minPrice);
    }
    if (maxPrice) {
      sql += ' AND price <= ?';
      params.push(maxPrice);
    }
    
    sql += ' ORDER BY sales DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const products = await query(sql, params);
    
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count').replace('ORDER BY sales DESC LIMIT ? OFFSET ?', '');
    const countParams = params.slice(0, -2);
    const total = await queryOne(countSql, countParams);
    
    res.json(success({ products, total: total?.count || 0, page, limit }));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.get('/hot', async (req, res) => {
  try {
    const products = await query('SELECT * FROM products WHERE status = 1 ORDER BY sales DESC LIMIT 8');
    res.json(success(products));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await queryOne('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [id]);
    if (!product) return res.json(error('商品不存在'));
    res.json(success(product));
  } catch (e) {
    res.json(error('获取失败'));
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, images, price, original_price, stock, style, specs, category_id } = req.body;
    if (!title || !price || !category_id) return res.json(error('参数错误'));
    
    const result = await execute('INSERT INTO products (title, description, images, price, original_price, stock, style, specs, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [title, description, JSON.stringify(images || []), price, original_price || 0, stock || 0, style, JSON.stringify(specs || {}), category_id]);
    
    const product = await queryOne('SELECT * FROM products WHERE id = ?', [result.lastID]);
    res.json(success(product, '创建成功'));
  } catch (e) {
    res.json(error('创建失败'));
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, images, price, original_price, stock, style, specs, category_id, status } = req.body;
    
    await execute('UPDATE products SET title = ?, description = ?, images = ?, price = ?, original_price = ?, stock = ?, style = ?, specs = ?, category_id = ?, status = ? WHERE id = ?', 
      [title, description, JSON.stringify(images || []), price, original_price || 0, stock || 0, style, JSON.stringify(specs || {}), category_id, status, id]);
    
    const product = await queryOne('SELECT * FROM products WHERE id = ?', [id]);
    res.json(success(product, '更新成功'));
  } catch (e) {
    res.json(error('更新失败'));
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await execute('UPDATE products SET status = 0 WHERE id = ?', [id]);
    res.json(success(null, '删除成功'));
  } catch (e) {
    res.json(error('删除失败'));
  }
});

module.exports = router;