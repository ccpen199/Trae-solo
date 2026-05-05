require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const db = require('./database/index');
const { getRedisClient } = require('./database/redis');

const teachersRouter = require('./routes/teachers');
const approvalsRouter = require('./routes/approvals');
const departmentsRouter = require('./routes/departments');

const app = express();

const PORT = process.env.PORT || 12261;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:12262';

const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await db.query('SELECT 1');
    let redisStatus = { status: 'disconnected' };
    
    try {
      const redis = await getRedisClient();
      if (redis && redis.isReady) {
        await redis.ping();
        redisStatus = { status: 'connected' };
      }
    } catch (e) {
      redisStatus = { status: 'disconnected', error: e.message };
    }

    res.json({
      success: true,
      message: '教师管理系统API服务运行正常',
      data: {
        server: {
          port: PORT,
          timestamp: new Date().toISOString()
        },
        database: {
          status: dbStatus ? 'connected' : 'disconnected'
        },
        redis: redisStatus
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: '服务健康检查失败',
      error: error.message
    });
  }
});

app.get('/api/init-db', async (req, res) => {
  try {
    const initSql = fs.readFileSync(
      path.join(__dirname, 'database', 'init.sql'),
      'utf8'
    );
    
    await db.query(initSql);
    
    res.json({
      success: true,
      message: '数据库初始化成功，已创建表、索引和示例部门数据'
    });
  } catch (error) {
    console.error('数据库初始化错误:', error);
    res.status(500).json({
      success: false,
      message: '数据库初始化失败',
      error: error.message
    });
  }
});

app.use('/api/teachers', teachersRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/departments', departmentsRouter);

app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

const startServer = async () => {
  try {
    console.log('正在启动教师管理系统后端服务...');
    console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    
    console.log('测试数据库连接...');
    await db.query('SELECT 1');
    console.log('数据库连接成功');
    
    console.log('尝试连接 Redis...');
    try {
      await getRedisClient();
      console.log('Redis 连接成功');
    } catch (e) {
      console.log('Redis 连接失败，将使用降级模式');
    }
    
    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log('  教师管理系统后端服务启动成功!');
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log(`  数据库初始化: http://localhost:${PORT}/api/init-db`);
      console.log(`  前端地址: ${FRONTEND_URL}`);
      console.log('========================================\n');
    });
  } catch (error) {
    console.error('启动服务失败:', error.message);
    process.exit(1);
  }
};

startServer();
