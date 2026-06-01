require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const customersRouter = require('./routes/customers');
const optometryRouter = require('./routes/optometry');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const processingRouter = require('./routes/processing');

const app = express();
const PORT = process.env.BACKEND_PORT || 58911;
const HOST = '127.0.0.1';

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 48911}`, `http://localhost:${process.env.FRONTEND_PORT || 48911}`],
  credentials: true
}));

app.use(express.json());

const logStream = fs.createWriteStream(path.join(__dirname, '../backend.log'), { flags: 'a' });
app.use(morgan('combined', { stream: logStream }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/customers', customersRouter);
app.use('/api/optometry', optometryRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/processing', processingRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, HOST, () => {
  console.log(`后端服务运行在 http://${HOST}:${PORT}`);
  console.log(`健康检查: http://${HOST}:${PORT}/api/health`);
});
