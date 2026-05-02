require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const initDatabase = require('./config/initDB');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const templateRoutes = require('./routes/templateRoutes');
const reverseRoutes = require('./routes/reverseRoutes');

const app = express();
const PORT = process.env.PORT || 11811;

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:21811',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/reverse', reverseRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'image-editor-backend'
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  在线图片编辑器后端服务`);
  console.log(`========================================`);
  console.log(`服务地址: http://localhost:${PORT}`);
  console.log(`API 前缀: /api`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
  console.log(`默认用户账号 (密码: 123456):`);
  console.log(`  - 设计运营: design_op`);
  console.log(`  - 创作者: editor`);
  console.log(`  - 商家: merchant`);
  console.log(`  - 审核: auditor`);
  console.log(`  - 管理员: admin`);
  console.log(`========================================`);
});

module.exports = app;
