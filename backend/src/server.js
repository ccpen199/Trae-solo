require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 98201;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:98202';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initDatabase();

const citiesRoutes = require('./routes/cities');
const carTypesRoutes = require('./routes/carTypes');
const ordersRoutes = require('./routes/orders');
const promotionsRoutes = require('./routes/promotions');
const messagesRoutes = require('./routes/messages');
const userLocationsRoutes = require('./routes/userLocations');

app.use('/api/cities', citiesRoutes);
app.use('/api/car-types', carTypesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/user-locations', userLocationsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '阳光出行后端服务运行中',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  阳光出行后端服务启动成功`);
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});

module.exports = app;
