require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const initDatabase = require('./database/init');

const vesselPlansRoutes = require('./routes/vesselPlans');
const containersRoutes = require('./routes/containers');
const tasksRoutes = require('./routes/tasks');
const gateAppointmentsRoutes = require('./routes/gateAppointments');
const usersRoutes = require('./routes/users');
const messagesRoutes = require('./routes/messages');
const exceptionsRoutes = require('./routes/exceptions');
const yardRoutes = require('./routes/yard');

const app = express();
const PORT = process.env.PORT || 11801;

app.use(cors({
  origin: ['http://localhost:11802', 'http://127.0.0.1:11802'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('正在初始化数据库...');
const db = initDatabase();

app.use((req, res, next) => {
  req.db = db;
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      port: PORT
    } 
  });
});

app.get('/api/dashboard/summary', (req, res) => {
  try {
    const vesselPlans = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM vessel_plans
      GROUP BY status
    `).all();

    const containers = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM containers
      GROUP BY status
    `).all();

    const tasks = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM tasks
      GROUP BY status
    `).all();

    const yardStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'OCCUPIED' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN status = 'LOCKED' THEN 1 ELSE 0 END) as locked
      FROM yard_locations
    `).get();

    const pendingExceptions = db.prepare(`
      SELECT COUNT(*) as count FROM exceptions WHERE status = 'PENDING'
    `).get();

    res.json({
      success: true,
      data: {
        vessel_plans: vesselPlans,
        containers: containers,
        tasks: tasks,
        yard: yardStats,
        pending_exceptions: pendingExceptions.count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use('/api/vessel-plans', vesselPlansRoutes(db));
app.use('/api/containers', containersRoutes(db));
app.use('/api/tasks', tasksRoutes(db));
app.use('/api/gate-appointments', gateAppointmentsRoutes(db));
app.use('/api/users', usersRoutes(db));
app.use('/api/messages', messagesRoutes(db));
app.use('/api/exceptions', exceptionsRoutes(db));
app.use('/api/yard', yardRoutes(db));

app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(500).json({ 
    success: false, 
    message: err.message || '内部服务器错误' 
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: '接口不存在' 
  });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  港口码头作业系统后端服务已启动`);
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`  API 前缀: /api`);
  console.log(`========================================`);
  console.log(`可用的 API 接口:`);
  console.log(`  - GET  /api/health                  - 健康检查`);
  console.log(`  - GET  /api/dashboard/summary       - 仪表盘统计`);
  console.log(`  - POST /api/users/login             - 用户登录`);
  console.log(`  - GET  /api/vessel-plans            - 船舶计划列表`);
  console.log(`  - POST /api/vessel-plans            - 创建船舶计划`);
  console.log(`  - GET  /api/containers              - 集装箱列表`);
  console.log(`  - POST /api/containers              - 创建集装箱`);
  console.log(`  - GET  /api/tasks                   - 任务列表`);
  console.log(`  - POST /api/tasks                   - 创建任务`);
  console.log(`  - GET  /api/yard                    - 堆场位置列表`);
  console.log(`  - POST /api/yard/allocate           - 分配堆场`);
  console.log(`  - GET  /api/gate-appointments       - 闸口预约列表`);
  console.log(`  - POST /api/gate-appointments       - 创建闸口预约`);
  console.log(`  - GET  /api/exceptions              - 异常列表`);
  console.log(`  - GET  /api/messages                - 消息列表`);
  console.log(`========================================`);
});

process.on('SIGINT', () => {
  console.log('\n正在关闭数据库连接...');
  db.close();
  console.log('服务已停止');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭数据库连接...');
  db.close();
  console.log('服务已停止');
  process.exit(0);
});
