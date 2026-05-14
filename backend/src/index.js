const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { initDatabase } = require('./database');
const rankingsRouter = require('./routes/rankings');
const searchRouter = require('./routes/search');
const productsRouter = require('./routes/products');

const app = express();
const PORT = process.env.BACKEND_PORT || 9941;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 9942;

app.use(cors({
  origin: [
    `http://localhost:${FRONTEND_PORT}`,
    `http://127.0.0.1:${FRONTEND_PORT}`
  ],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/rankings', rankingsRouter);
app.use('/api/search', searchRouter);
app.use('/api/products', productsRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

initDatabase();

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`品质好物种草后端服务已启动`);
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});
