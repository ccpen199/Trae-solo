const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const initDatabase = require('./db/init');

const PORT = process.env.PORT || 9910;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:9911';

const app = express();

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:9911'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

console.log('正在初始化数据库...');
const db = initDatabase();
console.log('数据库初始化完成');

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: '服务正常',
    data: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

const userRoutes = require('./routes/user')(db);
const productRoutes = require('./routes/product')(db);
const orderRoutes = require('./routes/order')(db);
const contentRoutes = require('./routes/content')(db);
const messageRoutes = require('./routes/message')(db);

app.use('/api/user', userRoutes);
app.use('/api/product', productRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/message', messageRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null
  });
});

app.get(/^\/(?!api).*/, (req, res) => {
  res.json({
    code: 404,
    message: '页面不存在',
    data: null
  });
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 后端服务启动成功！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================\n`);
});
