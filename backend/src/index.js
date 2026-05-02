require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// 导入数据库初始化
const { db, initDatabase, initSeedData } = require('./database/init');

// 导入引擎
const StatusEngine = require('./engines/statusEngine');
const AuditEngine = require('./engines/auditEngine');
const ReleaseEngine = require('./engines/releaseEngine');

// 导入路由
const authRoutes = require('./routes/auth');
const pipelineRoutes = require('./routes/pipelines');
const orderRoutes = require('./routes/orders');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 11177;

// 中间件配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:21177',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 初始化数据库
console.log('正在初始化数据库...');
initDatabase();
initSeedData();
console.log('数据库初始化完成');

// 初始化引擎
const statusEngine = new StatusEngine(db);
const auditEngine = new AuditEngine(db);
const releaseEngine = new ReleaseEngine(db, statusEngine, auditEngine);

// 健康检查接口
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

// 状态常量接口
app.get('/api/constants', (req, res) => {
  res.json({
    success: true,
    data: {
      statuses: {
        pending_code: '待代码提交',
        pending_trigger: '待触发流水线',
        pending_build: '待构建测试',
        pending_deploy: '待部署',
        pending_monitor: '待监控回滚',
        completed: '已完成',
        failed: '失败',
        rolled_back: '已回滚'
      },
      roles: {
        developer: '开发人员',
        tester: '测试人员',
        ops: '运维人员',
        release_manager: '发布经理'
      },
      stages: {
        code_submit: '代码提交',
        trigger: '触发流水线',
        build_test: '构建测试',
        deploy: '部署',
        monitor: '监控回滚'
      },
      itemStatuses: {
        pending: '待处理',
        in_progress: '处理中',
        completed: '已完成',
        failed: '失败',
        skipped: '已跳过'
      }
    }
  });
});

// 注册路由
app.use('/api/auth', authRoutes(db));
app.use('/api/pipelines', pipelineRoutes(db, statusEngine, auditEngine));
app.use('/api/orders', orderRoutes(db, statusEngine, auditEngine, releaseEngine));
app.use('/api/reports', reportRoutes(db, statusEngine, releaseEngine));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || '服务器内部错误' 
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: '接口不存在' 
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  CI/CD 持续集成平台 - 后端服务');
  console.log('========================================');
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log('========================================');
  console.log('  默认测试账号:');
  console.log('  - 开发人员: dev1 / 123456');
  console.log('  - 测试人员: test1 / 123456');
  console.log('  - 运维人员: ops1 / 123456');
  console.log('  - 发布经理: rm1 / 123456');
  console.log('========================================');
});
