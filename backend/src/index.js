require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const { initDatabase, seedInitialData } = require('./database');

const authRoutes = require('./routes/auth');
const permissionRoutes = require('./routes/permissions');
const configRoutes = require('./routes/configs');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.BACKEND_PORT || 20784;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:30784';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initDatabase();
seedInitialData();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/configs', configRoutes);
app.use('/api/orders', orderRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, () => {
  console.log(`大件订单多维度调度系统后端已启动`);
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log(`API 根路径: http://localhost:${PORT}/api`);
  console.log(`前端 CORS 地址: ${CORS_ORIGIN}`);
});
