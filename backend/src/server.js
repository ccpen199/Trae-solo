require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const inventoryRoutes = require('./routes/inventory');
const skuRoutes = require('./routes/skus');
const orderRoutes = require('./routes/orders');
const pickingRoutes = require('./routes/picking');
const reviewRoutes = require('./routes/review');
const deliveryRoutes = require('./routes/delivery');
const aftersaleRoutes = require('./routes/aftersale');
const statsRoutes = require('./routes/stats');

require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58955;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48955}`,
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/inventory', inventoryRoutes);
app.use('/api/skus', skuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/picking', pickingRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/aftersale', aftersaleRoutes);
app.use('/api/stats', statsRoutes);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
