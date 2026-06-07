const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const providerRoutes = require('./routes/providers');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const riskRoutes = require('./routes/risk');
const gatewayRoutes = require('./routes/gateway');
const fulfillmentRoutes = require('./routes/fulfillment');
const arbitrationRoutes = require('./routes/arbitration');
const feeRoutes = require('./routes/fee');
const reportRoutes = require('./routes/reports');

const app = express();

app.use(cors({ origin: 'http://127.0.0.1:48945' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/risk-events', riskRoutes);
app.use('/api/gateway', gatewayRoutes);
app.use('/api/fulfillment', fulfillmentRoutes);
app.use('/api/arbitrations', arbitrationRoutes);
app.use('/api/fee-config', feeRoutes);
app.use('/api/reports', reportRoutes);

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: '服务器内部错误' });
});

module.exports = app;
