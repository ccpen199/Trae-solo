require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.BACKEND_PORT || 56824;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

const customersRouter = require('./routes/customers');
const driversRouter = require('./routes/drivers');
const vehiclesRouter = require('./routes/vehicles');
const ordersRouter = require('./routes/orders');
const feesRouter = require('./routes/fees');
const exceptionsRouter = require('./routes/exceptions');
const dashboardRouter = require('./routes/dashboard');

app.use('/api/customers', customersRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/fees', feesRouter);
app.use('/api/exceptions', exceptionsRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`拖车派单系统后端服务启动成功`);
  console.log(`服务地址: http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
