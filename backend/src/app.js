require('dotenv').config();
const express = require('express');
const cors = require('cors');
const createTables = require('./config/initDb');

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');

const app = express();
const PORT = process.env.PORT || 12220;

app.use(cors({
  origin: ['http://localhost:21220', 'http://127.0.0.1:21220'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务运行正常', timestamp: new Date().toISOString() });
});

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/carts', cartRoutes);

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '请求的接口不存在' });
});

const startServer = async () => {
  try {
    console.log('正在初始化数据库...');
    await createTables();
    console.log('数据库初始化完成');
    
    app.listen(PORT, () => {
      console.log(`================================================`);
      console.log(`  网上商城后端服务已启动`);
      console.log(`  访问地址: http://localhost:${PORT}`);
      console.log(`  API 地址: http://localhost:${PORT}/api`);
      console.log(`================================================`);
      console.log(`  默认管理员账号:`);
      console.log(`  用户名: admin`);
      console.log(`  密码: admin123`);
      console.log(`================================================`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();
