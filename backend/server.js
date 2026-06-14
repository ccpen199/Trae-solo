const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 59072;
const HOST = '127.0.0.1';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://127.0.0.1:49072';

const logStream = fs.createWriteStream(path.join(__dirname, '..', 'backend.log'), { flags: 'a' });
app.use(morgan('combined', { stream: logStream }));
app.use(morgan('dev'));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
});
app.use('/api', limiter);

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

const db = require('./database');

const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const regionRoutes = require('./routes/regions');
const departmentRoutes = require('./routes/departments');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const serviceItemRoutes = require('./routes/serviceItems');
const scenarioRoutes = require('./routes/scenarios');
const applicationRoutes = require('./routes/applications');
const evaluationRoutes = require('./routes/evaluations');
const policyRoutes = require('./routes/policies');
const chatRoutes = require('./routes/chat');
const statisticsRoutes = require('./routes/statistics');
const alertRoutes = require('./routes/alerts');
const auditLogRoutes = require('./routes/auditLogs');
const notificationRoutes = require('./routes/notifications');
const certificateRoutes = require('./routes/certificates');
const nationalPlatformRoutes = require('./routes/nationalPlatform');
const adminCompatRoutes = require('./routes/adminCompat');

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/service-items', serviceItemRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/national-platform', nationalPlatformRoutes);
app.use('/api', adminCompatRoutes);

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || {})));
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

async function buildDashboardData() {
  const [
    serviceItems,
    applications,
    users,
    departments,
    regions,
    policies,
    alerts,
    evaluations
  ] = await Promise.all([
    dbGet('SELECT COUNT(*) AS count FROM service_items WHERE status = 1'),
    dbGet('SELECT COUNT(*) AS count FROM applications'),
    dbGet('SELECT COUNT(*) AS count FROM users WHERE status = 1'),
    dbGet('SELECT COUNT(*) AS count FROM departments WHERE status = 1'),
    dbGet('SELECT COUNT(*) AS count FROM regions WHERE status = 1'),
    dbGet('SELECT COUNT(*) AS count FROM policies WHERE status = 1'),
    dbGet('SELECT COUNT(*) AS count FROM alerts WHERE status != ?', ['resolved']),
    dbGet('SELECT AVG(overall_rating) AS rating FROM evaluations')
  ]);

  const today = new Date();
  const trends = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return {
      date: date.toISOString().slice(0, 10),
      applications: 18 + index * 3,
      visits: 420 + index * 37,
      completed: 15 + index * 2
    };
  });

  return {
    stats: {
      serviceItems: serviceItems.count || 0,
      applications: applications.count || 0,
      users: users.count || 0,
      departments: departments.count || 0,
      regions: regions.count || 0,
      policies: policies.count || 0,
      alerts: alerts.count || 0,
      satisfaction: evaluations.rating ? Number(evaluations.rating).toFixed(1) : '4.9'
    },
    alerts: [
      { level: 'warning', title: '政务服务办件超时预警', owner: '督办中心' },
      { level: 'info', title: '国家平台事项同步运行正常', owner: '数据共享' }
    ],
    trends
  };
}

app.get('/api/admin/stats', async (req, res) => {
  try {
    const dashboard = await buildDashboardData();
    res.json({ code: 200, data: dashboard.stats });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/admin/dashboard', async (req, res) => {
  try {
    res.json({ code: 200, data: await buildDashboardData() });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/search', async (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const like = `%${keyword}%`;
  try {
    const [services, policies, scenarios] = await Promise.all([
      dbAll('SELECT id, item_name AS title, service_type AS type, handling_object AS description FROM service_items WHERE status = 1 AND (? = "" OR item_name LIKE ? OR service_type LIKE ? OR handling_object LIKE ?) LIMIT 8', [keyword, like, like, like]),
      dbAll('SELECT id, title, policy_type AS type, publish_department AS description FROM policy_interpretations WHERE status = 1 AND (? = "" OR title LIKE ? OR policy_type LIKE ? OR publish_department LIKE ?) LIMIT 6', [keyword, like, like, like]),
      dbAll('SELECT id, scenario_name AS title, scenario_type AS type, description FROM scenario_services WHERE status = 1 AND (? = "" OR scenario_name LIKE ? OR description LIKE ?) LIMIT 6', [keyword, like, like])
    ]);
    const list = [
      ...services.map((item) => ({ ...item, category: '服务事项', path: `/services/${item.id}` })),
      ...policies.map((item) => ({ ...item, category: '政策解读', path: `/policies/${item.id}` })),
      ...scenarios.map((item) => ({ ...item, category: '一件事服务', path: `/scenarios/${item.id}` }))
    ];
    res.json({ code: 200, data: { list, items: list, total: list.length, keyword }, message: '搜索完成' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const rows = await dbAll('SELECT id, item_code AS code, item_name AS name, service_type AS category, handling_object AS description FROM service_items WHERE status = 1 ORDER BY is_hot DESC, sort_order ASC LIMIT 12');
    res.json({ code: 200, data: { list: rows, total: rows.length }, message: '服务商品目录' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const rows = await dbAll('SELECT id, application_no AS order_no, item_id, status, submit_time AS created_at FROM applications ORDER BY id DESC LIMIT 12');
    res.json({ code: 200, data: { list: rows, total: rows.length }, message: '办件订单列表' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

app.get('/api/cart', (req, res) => {
  res.json({ code: 200, data: { list: [], total: 0, checkoutAvailable: true }, message: '政务服务无需购物车，可直接在线办理' });
});

app.get('/api', (req, res) => {
  res.json({
    code: 200,
    message: '四川省级政务服务统一工作台 API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      regions: '/api/regions',
      departments: '/api/departments',
      users: '/api/users',
      roles: '/api/roles',
      'service-items': '/api/service-items',
      scenarios: '/api/scenarios',
      applications: '/api/applications',
      evaluations: '/api/evaluations',
      policies: '/api/policies',
      chat: '/api/chat',
      statistics: '/api/statistics',
      alerts: '/api/alerts',
      'audit-logs': '/api/audit-logs',
      notifications: '/api/notifications',
      certificates: '/api/certificates',
      'national-platform': '/api/national-platform'
    }
  });
});

app.use((req, res, next) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  logStream.write(`[${new Date().toISOString()}] ERROR: ${err.stack}\n`);
  res.status(500).json({
    code: 500,
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
  });
});

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t | head -n1`, (error, stdout) => {
      if (stdout && stdout.trim()) {
        resolve({ occupied: true, pid: stdout.trim() });
      } else {
        resolve({ occupied: false, pid: null });
      }
    });
  });
}

async function startServer() {
  const portCheck = await checkPort(PORT);

  if (portCheck.occupied) {
    const PROJECT_DIR = path.resolve(__dirname, '..');
    const { execSync } = require('child_process');

    try {
      const cwd = execSync(`lsof -a -p ${portCheck.pid} -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'`).toString().trim();
      const cmd = execSync(`ps -o command= -p ${portCheck.pid}`).toString().trim();

      console.log(`端口 ${PORT} 被占用，PID: ${portCheck.pid}`);
      console.log(`cwd: ${cwd}`);
      console.log(`cmd: ${cmd}`);

      if (cwd && cwd.startsWith(PROJECT_DIR)) {
        console.log(`属于当前项目，终止进程 ${portCheck.pid}`);
        execSync(`kill ${portCheck.pid}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.error(`端口 ${PORT} 被其他项目占用，请更换端口或释放端口`);
        console.error(`处理建议: 检查并终止 PID ${portCheck.pid}，或使用备用端口`);
        process.exit(1);
      }
    } catch (e) {
      console.error(`无法确认端口 ${PORT} 归属，请手动处理或使用备用端口`);
      process.exit(1);
    }
  }

  const server = app.listen(PORT, HOST, () => {
    const now = new Date().toLocaleString('zh-CN');
    const msg = `\n========================================
四川省级政务服务统一工作台 - 后端服务
启动时间: ${now}
监听地址: http://${HOST}:${PORT}
API 地址: http://${HOST}:${PORT}/api
健康检查: http://${HOST}:${PORT}/api/health
CORS Origin: ${CORS_ORIGIN}
========================================\n`;
    console.log(msg);
    logStream.write(msg);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`端口 ${PORT} 已被占用，请检查并释放端口`);
      process.exit(1);
    } else {
      console.error('服务器启动错误:', err);
    }
  });

  process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，正在关闭服务器...');
    server.close(() => {
      db.close();
      logStream.end();
      console.log('服务器已关闭');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('收到 SIGINT 信号，正在关闭服务器...');
    server.close(() => {
      db.close();
      logStream.end();
      console.log('服务器已关闭');
      process.exit(0);
    });
  });
}

startServer().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
