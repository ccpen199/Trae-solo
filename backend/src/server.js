require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./database');

const productsRouter = require('./routes/products');
const suppliersRouter = require('./routes/suppliers');
const storesRouter = require('./routes/stores');
const employeesRouter = require('./routes/employees');
const ordersRouter = require('./routes/orders');
const pickingsRouter = require('./routes/pickings');
const receiptsRouter = require('./routes/receipts');
const settlementsRouter = require('./routes/settlements');

const app = express();
const PORT = process.env.BACKEND_PORT || 56926;

app.use(cors());
app.use(express.json());

const frontendDist = path.join(__dirname, '../../frontend/dist');

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard', (req, res) => {
  const orderStats = db.prepare(`
    SELECT status, COUNT(*) as count FROM orders GROUP BY status
  `).all();
  
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders WHERE order_date = ?
  `).get(today);
  
  const pendingPickings = db.prepare(`
    SELECT COUNT(*) as count FROM pickings WHERE status = 'pending'
  `).get();
  
  const pendingReceipts = db.prepare(`
    SELECT COUNT(*) as count FROM receipts WHERE status = 'pending'
  `).get();
  
  res.json({
    order_stats: orderStats,
    today_orders: todayOrders.count,
    pending_pickings: pendingPickings.count,
    pending_receipts: pendingReceipts.count
  });
});

app.use('/api/products', productsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/stores', storesRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/pickings', pickingsRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/settlements', settlementsRouter);

app.use(express.static(frontendDist));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`服务运行在 http://127.0.0.1:${PORT}`);
});
