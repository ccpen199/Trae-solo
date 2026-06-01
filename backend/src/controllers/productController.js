const { db } = require('../models/database');

const getCategories = (req, res) => {
  const rows = db.prepare('SELECT * FROM categories WHERE status = 1 ORDER BY sort ASC').all();
  res.json({ code: 200, msg: 'success', data: rows });
};

const getProducts = (req, res) => {
  const { category_id, keyword, page = 1, pageSize = 20 } = req.query;
  let sql = 'SELECT * FROM products WHERE status = 1';
  const params = [];
  
  if (category_id) {
    sql += ' AND category_id = ?';
    params.push(category_id);
  }
  if (keyword) {
    sql += ' AND name LIKE ?';
    params.push(`%${keyword}%`);
  }
  
  sql += ' ORDER BY sales DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (page - 1) * pageSize);
  
  const rows = db.prepare(sql).all(...params);
  const products = rows.map(p => ({
    ...p,
    images: JSON.parse(p.images || '[]'),
    specs: JSON.parse(p.specs || '[]')
  }));
  res.json({ code: 200, msg: 'success', data: { list: products, total: rows.length } });
};

const getProductDetail = (req, res) => {
  const { id } = req.params;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) {
    return res.json({ code: 404, msg: '商品不存在', data: null });
  }
  const result = {
    ...product,
    images: JSON.parse(product.images || '[]'),
    specs: JSON.parse(product.specs || '[]')
  };
  res.json({ code: 200, msg: 'success', data: result });
};

const getThemeProducts = (req, res) => {
  const { id } = req.params;
  const theme = db.prepare('SELECT * FROM themes WHERE id = ?').get(id);
  if (!theme) {
    return res.json({ code: 404, msg: '主题不存在', data: null });
  }
  const productIds = JSON.parse(theme.product_ids || '[]');
  if (productIds.length === 0) {
    return res.json({ code: 200, msg: 'success', data: { theme, products: [] } });
  }
  const placeholders = productIds.map(() => '?').join(',');
  const products = db.prepare(`SELECT * FROM products WHERE id IN (${placeholders})`).all(...productIds);
  const productList = products.map(p => ({
    ...p,
    images: JSON.parse(p.images || '[]')
  }));
  res.json({ code: 200, msg: 'success', data: { theme, products: productList } });
};

module.exports = { getCategories, getProducts, getProductDetail, getThemeProducts };
