require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const pool = require('./config/database');
const { connectRedis } = require('./config/redis');

const categoriesRouter = require('./routes/categories');
const newsRouter = require('./routes/news');
const sectionsRouter = require('./routes/sections');

const app = express();
const PORT = process.env.PORT || 22261;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:22262',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/static', express.static(path.join(__dirname, '../static_output')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CMS API is running', timestamp: new Date().toISOString() });
});

app.use('/api/categories', categoriesRouter);
app.use('/api/news', newsRouter);
app.use('/api/sections', sectionsRouter);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

async function startServer() {
  try {
    await pool.query('SELECT NOW()');
    console.log('PostgreSQL connection test successful');
    
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log('========================================');
      console.log('  资讯CMS后端服务已启动');
      console.log(`  访问地址: http://localhost:${PORT}`);
      console.log(`  前端地址: ${process.env.FRONTEND_URL || 'http://localhost:22262'}`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.log('\n提示: 请确保PostgreSQL数据库已创建并可访问');
    console.log(`数据库配置: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    process.exit(1);
  }
}

startServer();
