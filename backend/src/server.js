require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./database');
const { authMiddleware } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/applications');
const configRoutes = require('./routes/config');
const taskRoutes = require('./routes/tasks');
const changeOrderRoutes = require('./routes/changeOrders');
const alertRoutes = require('./routes/alerts');
const auditRoutes = require('./routes/audit');
const userRoutes = require('./routes/users');

const app = express();

const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '43387');
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '53387');

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  const { v4: uuidv4 } = require('uuid');
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    db.prepare(`
      INSERT INTO api_call_logs (id, endpoint, method, request_params, response_status, duration, caller_ip)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      req.path,
      req.method,
      JSON.stringify(req.body || req.query),
      res.statusCode,
      duration,
      req.ip || req.connection.remoteAddress
    );
  });
  
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/applications', authMiddleware, appRoutes);
app.use('/api/config', authMiddleware, configRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/change-orders', authMiddleware, changeOrderRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/audit', authMiddleware, auditRoutes);
app.use('/api/users', authMiddleware, userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get();
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM execution_tasks').get();
  const pendingTaskCount = db.prepare('SELECT COUNT(*) as count FROM execution_tasks WHERE status = ?').get('pending');
  const alertCount = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE status = ?').get('open');
  
  const recentTasks = db.prepare(`
    SELECT t.*, a.name as app_name, u.name as creator_name
    FROM execution_tasks t
    JOIN applications a ON t.app_id = a.id
    JOIN users u ON t.created_by = u.id
    ORDER BY t.created_at DESC
    LIMIT 5
  `).all();

  const recentAlerts = db.prepare(`
    SELECT a.*, app.name as app_name, u.name as responsible_name
    FROM alerts a
    LEFT JOIN applications app ON a.app_id = app.id
    LEFT JOIN users u ON a.responsible_id = u.id
    WHERE a.status = 'open'
    ORDER BY a.created_at DESC
    LIMIT 5
  `).all();

  res.json({
    stats: {
      applications: appCount.count,
      tasks: taskCount.count,
      pendingTasks: pendingTaskCount.count,
      alerts: alertCount.count
    },
    recentTasks,
    recentAlerts
  });
});

const checkPort = (port) => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`lsof -ti tcp:${port}`, (error, stdout) => {
      if (stdout.trim()) {
        resolve(stdout.trim().split('\n'));
      } else {
        resolve([]);
      }
    });
  });
};

const findAvailablePort = async (basePort, slot, tail4) => {
  const port = basePort + (slot * 10000) + tail4;
  const pids = await checkPort(port);
  return { port, available: pids.length === 0, pids };
};

const startServer = async () => {
  const projectName = path.basename(path.dirname(__dirname));
  const tail4Match = projectName.match(/-(\d+)$/);
  const tail4 = tail4Match ? parseInt(tail4Match[1].slice(-4).padStart(4, '0')) % 10000 : 3387;

  let finalPort = BACKEND_PORT;
  let foundPort = false;

  for (let slot = 0; slot <= 5; slot++) {
    const { port, available, pids } = await findAvailablePort(50000, slot, tail4);
    if (available) {
      finalPort = port;
      foundPort = true;
      break;
    } else {
      console.log(`端口 ${port} 被占用 (PID: ${pids.join(', ')})，尝试下一个槽位...`);
    }
  }

  if (!foundPort) {
    console.error('错误：所有后端端口槽位都被占用！');
    process.exit(1);
  }

  if (finalPort !== BACKEND_PORT) {
    const envPath = path.join(__dirname, '..', '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/BACKEND_PORT=\d+/, `BACKEND_PORT=${finalPort}`);
    envContent = envContent.replace(/API_BASE_URL=http:\/\/127\.0\.0\.1:\d+/, `API_BASE_URL=http://127.0.0.1:${finalPort}`);
    envContent = envContent.replace(/VITE_API_BASE_URL=http:\/\/127\.0\.0\.1:\d+/, `VITE_API_BASE_URL=http://127.0.0.1:${finalPort}`);
    fs.writeFileSync(envPath, envContent);
    console.log(`端口已更新为 ${finalPort} 并写入 .env`);
  }

  app.listen(finalPort, '127.0.0.1', () => {
    console.log(`\n========================================`);
    console.log(`  配置灰度发布系统 - 后端服务`);
    console.log(`========================================`);
    console.log(`  地址: http://127.0.0.1:${finalPort}`);
    console.log(`  数据库: ${path.join(__dirname, '..', 'data', 'app.sqlite')}`);
    console.log(`  启动时间: ${new Date().toLocaleString()}`);
    console.log(`========================================\n`);
  });
};

startServer();
