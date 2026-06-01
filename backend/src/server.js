require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const ruleRoutes = require('./routes/rules');
const taskRoutes = require('./routes/tasks');
const logRoutes = require('./routes/logs');
const alertRoutes = require('./routes/alerts');
const userRoutes = require('./routes/users');
const changeOrderRoutes = require('./routes/changeOrders');

const app = express();
const PORT = process.env.BACKEND_PORT || 53383;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43383}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users', userRoutes);
app.use('/api/change-orders', changeOrderRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec(`lsof -ti tcp:${port} 2>/dev/null`, (error, stdout) => {
      if (error) {
        resolve(null);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

async function startServer() {
  const pid = await checkPort(PORT);
  if (pid) {
    console.error(`端口 ${PORT} 已被占用 (PID: ${pid})`);
    console.error(`请终止该进程或使用备用端口`);
    process.exit(1);
  }

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`\n========================================`);
    console.log(`日志脱敏代理服务 - 后端服务已启动`);
    console.log(`监听地址: http://127.0.0.1:${PORT}`);
    console.log(`API 基础路径: http://127.0.0.1:${PORT}/api`);
    console.log(`数据库路径: ${path.join(__dirname, '../../data/app.sqlite')}`);
    console.log(`========================================\n`);
  });
}

startServer();
