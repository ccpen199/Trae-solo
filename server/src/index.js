require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const sequelize = require('./config/database');
const { getRedisClient } = require('./config/redis');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const newsRoutes = require('./routes/newsRoutes');
const mockController = require('./controllers/mockController');

const app = express();
const PORT = process.env.PORT || 22131;

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:22132',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('combined'));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务器运行正常', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '企业网站 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      news: '/api/news'
    }
  });
});

const setupMockRoutes = () => {
  console.log('设置模拟数据路由...');
  
  const authMockRouter = express.Router();
  authMockRouter.post('/login', mockController.mockLogin);
  authMockRouter.post('/register', mockController.mockRegister);
  authMockRouter.get('/me', mockController.getMockCurrentUser);
  
  const productMockRouter = express.Router();
  productMockRouter.get('/', mockController.getMockProducts);
  productMockRouter.get('/recommended', mockController.getMockRecommendedProducts);
  productMockRouter.get('/new', mockController.getMockNewProducts);
  productMockRouter.get('/hot', mockController.getMockHotProducts);
  productMockRouter.get('/categories', mockController.getMockProductCategories);
  productMockRouter.get('/:id', mockController.getMockProductDetail);
  
  const newsMockRouter = express.Router();
  newsMockRouter.get('/', mockController.getMockNews);
  newsMockRouter.get('/latest', mockController.getMockLatestNews);
  newsMockRouter.get('/recommended', mockController.getMockRecommendedNews);
  newsMockRouter.get('/categories', mockController.getMockNewsCategories);
  newsMockRouter.get('/:id', mockController.getMockNewsDetail);
  
  app.use('/api/auth', authMockRouter);
  app.use('/api/products', productMockRouter);
  app.use('/api/news', newsMockRouter);
  
  console.log('模拟数据路由设置完成');
};

const setupRealRoutes = () => {
  console.log('设置数据库路由...');
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/news', newsRoutes);
  console.log('数据库路由设置完成');
};

const setupErrorHandlers = () => {
  console.log('设置错误处理中间件...');
  
  app.use((err, req, res, next) => {
    console.error('错误:', err.stack);
    
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: '数据验证失败', errors: err.errors });
    }
    
    res.status(500).json({ success: false, message: '服务器内部错误' });
  });
  
  app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: '接口不存在' });
  });
  
  console.log('错误处理中间件设置完成');
};

const startServer = async () => {
  let useMockData = false;
  
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    await sequelize.sync({ alter: true });
    console.log('数据库同步完成');
    
    setupRealRoutes();
    
    try {
      const redisClient = getRedisClient();
      if (redisClient) {
        await redisClient.ping();
        console.log('Redis 连接成功');
      }
    } catch (redisError) {
      console.log('Redis 不可用，将在无 Redis 模式下运行');
    }
    
  } catch (dbError) {
    console.log('数据库连接失败:', dbError.message);
    console.log('将使用模拟数据模式运行');
    useMockData = true;
    
    setupMockRoutes();
  }
  
  setupErrorHandlers();
  
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`API 地址: http://localhost:${PORT}/api`);
    if (useMockData) {
      console.log('运行模式: 模拟数据模式');
      console.log('可用测试账号:');
      console.log('  管理员: admin / admin123');
      console.log('  普通用户: test / test123');
    } else {
      console.log('运行模式: 数据库模式');
    }
  });
};

startServer();

module.exports = app;