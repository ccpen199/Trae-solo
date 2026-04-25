const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const products = db.prepare(`
    SELECT p.*, c.name as competitor_name, c.platform
    FROM product_prices p
    JOIN competitors c ON p.competitor_id = c.id
    ORDER BY p.recorded_at DESC
  `).all();
  res.json(products);
});

router.get('/:id', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as competitor_name, c.platform
    FROM product_prices p
    JOIN competitors c ON p.competitor_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const priceHistory = db.prepare(`
    SELECT * FROM price_history 
    WHERE product_price_id = ? 
    ORDER BY recorded_at DESC
  `).all(req.params.id);
  
  res.json({ ...product, priceHistory });
});

router.post('/', (req, res) => {
  const { competitor_id, product_name, product_url, current_price, original_price, currency, stock_status } = req.body;
  
  if (!competitor_id || !product_name) {
    return res.status(400).json({ error: 'Competitor ID and product name are required' });
  }
  
  const competitor = db.prepare(`
    SELECT * FROM competitors WHERE id = ?
  `).get(competitor_id);
  
  if (!competitor) {
    return res.status(404).json({ error: 'Competitor not found' });
  }
  
  const result = db.prepare(`
    INSERT INTO product_prices (competitor_id, product_name, product_url, current_price, original_price, currency, stock_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    competitor_id,
    product_name,
    product_url || '',
    current_price || 0,
    original_price || current_price || 0,
    currency || 'USD',
    stock_status || 'In Stock'
  );
  
  const newProduct = db.prepare(`
    SELECT p.*, c.name as competitor_name, c.platform
    FROM product_prices p
    JOIN competitors c ON p.competitor_id = c.id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);
  
  res.status(201).json(newProduct);
});

router.put('/:id', (req, res) => {
  const { product_name, product_url, current_price, original_price, currency, stock_status } = req.body;
  
  const product = db.prepare(`
    SELECT * FROM product_prices WHERE id = ?
  `).get(req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  if (current_price !== undefined && current_price !== product.current_price) {
    db.prepare(`
      INSERT INTO price_history (product_price_id, price)
      VALUES (?, ?)
    `).run(req.params.id, product.current_price);
  }
  
  db.prepare(`
    UPDATE product_prices 
    SET product_name = ?, product_url = ?, current_price = ?, original_price = ?, currency = ?, stock_status = ?
    WHERE id = ?
  `).run(
    product_name || product.product_name,
    product_url !== undefined ? product_url : product.product_url,
    current_price !== undefined ? current_price : product.current_price,
    original_price !== undefined ? original_price : product.original_price,
    currency || product.currency,
    stock_status !== undefined ? stock_status : product.stock_status,
    req.params.id
  );
  
  const updatedProduct = db.prepare(`
    SELECT p.*, c.name as competitor_name, c.platform
    FROM product_prices p
    JOIN competitors c ON p.competitor_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);
  
  res.json(updatedProduct);
});

router.delete('/:id', (req, res) => {
  const product = db.prepare(`
    SELECT * FROM product_prices WHERE id = ?
  `).get(req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  db.transaction(() => {
    db.prepare(`DELETE FROM price_history WHERE product_price_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM product_prices WHERE id = ?`).run(req.params.id);
  })();
  
  res.json({ message: 'Product deleted successfully' });
});

router.get('/compare/:productName', (req, res) => {
  const productName = req.params.productName;
  
  const products = db.prepare(`
    SELECT p.*, c.name as competitor_name, c.platform
    FROM product_prices p
    JOIN competitors c ON p.competitor_id = c.id
    WHERE p.product_name LIKE ?
    ORDER BY p.current_price ASC
  `).all(`%${productName}%`);
  
  res.json(products);
});

module.exports = router;
