const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const initDatabase = require('./config/init');
const seedDatabase = require('./config/seed');
const userRoutes = require('./routes/users');
const furnitureRoutes = require('./routes/furniture');
const contentRoutes = require('./routes/content');
const interactionRoutes = require('./routes/interaction');

const app = express();
const PORT = process.env.PORT || 20787;

initDatabase();
seedDatabase();

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:30787', 'http://127.0.0.1:30787'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/users', userRoutes);
app.use('/api/furniture', furnitureRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/interaction', interactionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '服务运行正常', 
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/advertisements', (req, res) => {
  const advertisements = [
    {
      id: 1,
      title: '北欧风格沙发限时特惠',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20nordic%20style%20sofa%20furniture%20in%20bright%20living%20room&image_size=landscape_16_9',
      link: '/furniture/1',
      target_type: 'furniture',
      target_id: 1
    },
    {
      id: 2,
      title: '新品上市 - 智能书桌',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20smart%20desk%20with%20ergonomic%20design%20home%20office&image_size=landscape_16_9',
      link: '/furniture/2',
      target_type: 'furniture',
      target_id: 2
    },
    {
      id: 3,
      title: '装修攻略大全',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=home%20renovation%20guide%20interior%20design%20magazine%20cover&image_size=landscape_16_9',
      link: '/articles/1',
      target_type: 'article',
      target_id: 1
    }
  ];

  res.json({
    success: true,
    data: advertisements
  });
});

app.use((err, req, res, next) => {
  console.error('错误:', err);
  
  if (err.status === 400 || err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message || '请求参数错误'
    });
  }

  if (err.status === 401) {
    return res.status(401).json({
      success: false,
      message: err.message || '未授权访问'
    });
  }

  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.listen(PORT, () => {
  console.log(`🚀 后端服务已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
});
