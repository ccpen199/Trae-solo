require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');

const app = express();
const PORT = process.env.PORT || 12174;

app.use(cors({
  origin: ['http://localhost:22174', 'http://127.0.0.1:22174'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '休闲合成游戏后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    name: '休闲合成游戏后端服务',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      game: '/api/game',
      health: '/api/health'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('错误:', err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('  休闲合成游戏后端服务已启动');
  console.log('========================================');
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log('========================================');
});
