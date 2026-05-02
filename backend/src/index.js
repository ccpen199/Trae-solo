const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const { initDatabase } = require('./database/init');
const { authenticate } = require('./middleware/auth');

const authRoutes = require('./routes/auth.route');
const ordersRoutes = require('./routes/orders.route');
const notificationsRoutes = require('./routes/notifications.route');
const todosRoutes = require('./routes/todos.route');
const employeesRoutes = require('./routes/employees.route');
const departmentsRoutes = require('./routes/departments.route');

const app = express();

initDatabase();

const uploadPath = path.resolve(__dirname, '../', config.uploadPath);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth/current', authenticate);

app.use('/api/orders', authenticate, ordersRoutes);
app.use('/api/notifications', authenticate, notificationsRoutes);
app.use('/api/todos', authenticate, todosRoutes);
app.use('/api/employees', authenticate, employeesRoutes);
app.use('/api/departments', authenticate, departmentsRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || '服务器内部错误',
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
  });
});

app.listen(config.port, () => {
  console.log(`=============================================`);
  console.log(`  内部即时通讯系统后端服务已启动`);
  console.log(`=============================================`);
  console.log(`  访问地址: http://localhost:${config.port}`);
  console.log(`  端口: ${config.port}`);
  console.log(`  环境: ${config.nodeEnv}`);
  console.log(`  前端地址: ${config.frontendUrl}`);
  console.log(`=============================================`);
  console.log(`  测试账号:`);
  console.log(`  - admin (超级管理员): username=admin, password=任意`);
  console.log(`  - zhangsan (部门负责人): username=zhangsan, password=任意`);
  console.log(`  - lisi (普通员工): username=lisi, password=任意`);
  console.log(`=============================================`);
});
