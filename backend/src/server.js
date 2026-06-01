require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const customersRoute = require('./routes/customers');
const segmentsRoute = require('./routes/segments');
const productsRoute = require('./routes/products');
const touchRoute = require('./routes/touch');
const applicationsRoute = require('./routes/applications');
const reportsRoute = require('./routes/reports');

const app = express();
const PORT = process.env.BACKEND_PORT || 50000;

app.use(cors({
  origin: ['http://127.0.0.1:' + (process.env.FRONTEND_PORT || 40000), 'http://localhost:' + (process.env.FRONTEND_PORT || 40000)],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Installment Marketing API is running' });
});

app.use('/api/customers', customersRoute);
app.use('/api/segments', segmentsRoute);
app.use('/api/products', productsRoute);
app.use('/api/touch', touchRoute);
app.use('/api/applications', applicationsRoute);
app.use('/api/reports', reportsRoute);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 分期营销系统后端服务已启动`);
  console.log(`📍 地址: http://127.0.0.1:${PORT}`);
  console.log(`📊 API文档: http://127.0.0.1:${PORT}/api/health`);
});

module.exports = app;
