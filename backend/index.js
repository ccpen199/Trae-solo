const express = require('express');
const cors = require('cors');
const path = require('path');

const competitorsRouter = require('./routes/competitors');
const productsRouter = require('./routes/products');
const alertsRouter = require('./routes/alerts');
const hotProductsRouter = require('./routes/hotProducts');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/competitors', competitorsRouter);
app.use('/api/products', productsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/hot-products', hotProductsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard', (req, res) => {
  const db = require('./database');
  
  const stats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM competitors) as total_competitors,
      (SELECT COUNT(*) FROM product_prices) as total_products,
      (SELECT COUNT(*) FROM alerts WHERE is_read = 0) as unread_alerts,
      (SELECT AVG(current_price) FROM product_prices) as avg_price
  `).get();
  
  const recentProducts = db.prepare(`
    SELECT p.*, c.name as competitor_name, c.platform
    FROM product_prices p
    JOIN competitors c ON p.competitor_id = c.id
    ORDER BY p.recorded_at DESC
    LIMIT 10
  `).all();
  
  const priceComparison = db.prepare(`
    SELECT 
      product_name,
      MIN(current_price) as min_price,
      MAX(current_price) as max_price,
      AVG(current_price) as avg_price,
      COUNT(*) as competitor_count
    FROM product_prices
    GROUP BY product_name
    ORDER BY competitor_count DESC
  `).all();
  
  res.json({
    stats,
    recentProducts,
    priceComparison
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
