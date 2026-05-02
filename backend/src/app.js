require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const policyRoutes = require('./routes/policies');
const claimRoutes = require('./routes/claims');
const notificationRoutes = require('./routes/notifications');

const app = express();

app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || '内部服务器错误'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  保险投保理赔系统 - 后端服务');
  console.log('========================================');
  console.log('  服务地址: http://localhost:' + PORT);
  console.log('  环境: ' + config.nodeEnv);
  console.log('  数据库: SQLite (' + config.db.path + ')');
  console.log('========================================');
  console.log('  可用角色:');
  console.log('    - admin (管理员)');
  console.log('    - agent (代理人)');
  console.log('    - underwriter (核保员)');
  console.log('    - claim_adjuster (理赔员)');
  console.log('    - policyholder (投保人)');
  console.log('========================================');
  console.log('  默认账号:');
  console.log('    管理员: admin / admin123');
  console.log('    代理人: agent1 / agent123');
  console.log('    核保员: underwriter1 / under123');
  console.log('    理赔员: claim1 / claim123');
  console.log('    投保人: user1 / user123');
  console.log('========================================');
  console.log('  启动时间: ' + new Date().toLocaleString());
  console.log('========================================');
});

process.on('SIGTERM', () => {
  console.log('收到关闭信号，正在优雅关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到中断信号，正在优雅关闭...');
  process.exit(0);
});
