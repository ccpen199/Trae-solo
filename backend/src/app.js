require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initPool, isMemoryMode, query } = require('./config/database');
const { getRedisClient } = require('./config/redis');

const trainRoutes = require('./routes/trains');
const ticketRoutes = require('./routes/tickets');
const orderRoutes = require('./routes/orders');
const refundRoutes = require('./routes/refunds');

const app = express();
const PORT = process.env.PORT || 12217;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:22171',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', async (req, res) => {
  try {
    let dbStatus = 'connected';
    let dbType = isMemoryMode() ? 'memory' : 'postgresql';
    
    try {
      await query('SELECT 1');
    } catch (e) {
      dbStatus = 'error';
    }

    const redisClient = await getRedisClient();
    let redisStatus = 'unavailable';
    if (redisClient) {
      try {
        await redisClient.ping();
        redisStatus = 'available';
      } catch (e) {
        redisStatus = 'degraded';
      }
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      databaseType: dbType,
      redis: redisStatus,
      port: PORT,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

app.use('/api/trains', trainRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/refunds', refundRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

const startServer = async () => {
  try {
    await initPool();
    
    const dbMode = isMemoryMode() ? '内存数据库' : 'PostgreSQL';
    console.log(`数据库模式: ${dbMode}`);
    
    await getRedisClient();
    
    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`  火车购票系统后端服务已启动`);
      console.log(`  端口: ${PORT}`);
      console.log(`  数据库: ${dbMode}`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer;

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  火车购票系统后端服务已启动`);
  console.log(`  端口: ${PORT}`);
  console.log(`  数据库: ${isMemoryMode() ? '内存数据库' : 'PostgreSQL'}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});
