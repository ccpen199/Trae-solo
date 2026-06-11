const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const db = require('./config/database');
const { initTables, initSeedData } = require('./scripts/initDb');

const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const servicesRoutes = require('./routes/services');
const newsRoutes = require('./routes/news');
const profileRoutes = require('./routes/profile');
const healthRoutes = require('./routes/health');

console.log('=== 国家级人社移动政务服务平台后端启动中 ===');
console.log('项目目录:', process.cwd());
console.log('监听地址:', config.host);
console.log('监听端口:', config.port);
console.log('前端地址:', config.frontendUrl);

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'http:', 'https:'],
    },
  },
}));

const allowedOrigins = new Set([
  config.frontendUrl,
  config.frontendUrl.replace('127.0.0.1', 'localhost'),
  'http://127.0.0.1:49088',
  'http://localhost:49088',
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
  keyGenerator: (req) => req.ip,
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { code: 429, message: '登录尝试过于频繁，请15分钟后再试' },
  keyGenerator: (req) => req.ip,
});
app.use('/api/auth/login', authLimiter);

app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: '国家级人社移动政务服务平台 API',
    version: '1.0.0',
    health: '/api/health',
    docs: '/api/health',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/search', async (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const like = `%${keyword}%`;
  const services = await db.allAsync(`
    SELECT id, name AS title, code, category, description, 'service' AS type
    FROM services
    WHERE is_enabled = 1 AND (? = '' OR name LIKE ? OR category LIKE ? OR description LIKE ?)
    ORDER BY sort_order ASC
    LIMIT 12
  `, keyword, like, like, like);
  const news = await db.allAsync(`
    SELECT id, title, category, summary AS description, 'news' AS type
    FROM news_articles
    WHERE ? = '' OR title LIKE ? OR summary LIKE ? OR content LIKE ?
    ORDER BY is_top DESC, is_hot DESC, publish_time DESC
    LIMIT 8
  `, keyword, like, like, like);
  res.json({ code: 200, data: { keyword, list: [...services, ...news] } });
});

app.get(['/api/admin/stats', '/api/admin/dashboard'], async (req, res) => {
  const [users, services, records, todos, unread] = await Promise.all([
    db.getAsync('SELECT COUNT(*) as count FROM users WHERE status = 1'),
    db.getAsync('SELECT COUNT(*) as count FROM services WHERE is_enabled = 1'),
    db.getAsync('SELECT COUNT(*) as count FROM service_records'),
    db.getAsync("SELECT COUNT(*) as count FROM todo_items WHERE status = 'pending'"),
    db.getAsync('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0'),
  ]);
  res.json({
    code: 200,
    data: {
      users: users.count,
      services: services.count,
      service_records: records.count,
      pending_todos: todos.count,
      unread_notifications: unread.count,
      modules: ['登录认证', '服务大厅', '资讯中心', '个人中心', '后台审计'],
    },
  });
});

app.get(['/api/users/profile', '/api/user/profile'], async (req, res) => {
  const user = await db.getAsync('SELECT id, real_name, phone, province, city, auth_level, created_at FROM users WHERE status = 1 ORDER BY id LIMIT 1');
  res.json({ code: 200, data: user });
});

app.use((req, res, next) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误', error: err.message });
});

const startServer = async () => {
  try {
    await initTables();
    await initSeedData();
    console.log('数据库初始化完成');
  } catch (err) {
    console.error('数据库初始化失败:', err);
  }

  const server = app.listen(config.port, config.host, () => {
    console.log('');
    console.log('=== 后端服务启动成功 ===');
    console.log(`监听地址: http://${config.host}:${config.port}`);
    console.log(`健康检查: http://${config.host}:${config.port}/api/health`);
    console.log('');
    console.log('测试账号: 13800138000 / 123456');
    console.log('');
  });

  const gracefulShutdown = async (signal) => {
    console.log(`收到 ${signal} 信号，正在关闭服务...`);
    server.close(async () => {
      await db.closeAsync();
      console.log('服务已关闭');
      process.exit(0);
    });
    setTimeout(async () => {
      console.error('强制关闭服务');
      await db.closeAsync();
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的 Promise 拒绝:', reason);
  });
};

startServer();

module.exports = app;
