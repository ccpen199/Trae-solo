const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { db, init } = require('./db');
const authRoutes = require('./routes/auth');
const farmerRoutes = require('./routes/farmers');
const financeRoutes = require('./routes/finance');
const villageRoutes = require('./routes/village');
const sunshineRoutes = require('./routes/sunshine');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.BACKEND_PORT || 59063;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 49063;

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
app.use(upload.none());

init();

app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected',
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      db: 'disconnected',
      error: err.message,
    });
  }
});

app.get('/api/home/stats', (req, res) => {
  try {
    const farmers = db.prepare('SELECT COUNT(*) as count FROM farmers').get().count;
    const finance = db.prepare('SELECT COUNT(*) as count FROM finance_products WHERE status = ?').get('active').count;
    const village = db.prepare("SELECT COUNT(*) as count FROM village_affairs WHERE status = 'published'").get().count;
    const votes = db.prepare("SELECT COUNT(*) as count FROM votes WHERE status = 'active'").get().count;
    const activities = [
      { id: 1, type: 'info', time: '刚刚', content: `农户档案已同步 ${farmers} 户，可追溯土地确权与种养标签` },
      { id: 2, type: 'finance', time: '10分钟前', content: `普惠金融产品 ${finance} 个，可发起贷款和保险申请` },
      { id: 3, type: 'village', time: '30分钟前', content: `村务公开 ${village} 条已完成区块链存证` },
      { id: 4, type: 'vote', time: '1小时前', content: `阳光村务当前有 ${votes} 个投票议题` },
    ];
    res.json({
      data: { farmers, finance, village, votes },
      activities,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 500 });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/village', villageRoutes);
app.use('/api/sunshine', sunshineRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在', code: 404, path: req.path });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || '服务器内部错误', code: 500 });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`数字乡村综合服务平台 Backend 已启动`);
  console.log(`监听地址: http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
