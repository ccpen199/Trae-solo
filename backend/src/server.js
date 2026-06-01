import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './database/init.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import applicationRoutes from './routes/applications.js';
import environmentRoutes from './routes/environments.js';
import strategyRoutes from './routes/strategies.js';
import taskRoutes from './routes/tasks.js';
import changeOrderRoutes from './routes/changeOrders.js';
import auditRoutes from './routes/audit.js';
import alertRoutes from './routes/alerts.js';
import exceptionRoutes from './routes/exceptions.js';
import reportRoutes from './routes/reports.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 53388;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43388}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/change-orders', changeOrderRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const stmt = db.prepare(`
    INSERT INTO exceptions (exception_no, exception_type, severity, error_details, stack_trace, status)
    VALUES (?, 'unknown', 'high', ?, ?, 'open')
  `);
  stmt.run(`EXC-${Date.now()}`, err.message, err.stack);
  
  res.status(500).json({ 
    error: '服务器内部错误',
    message: err.message
  });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n========================================`);
  console.log(`数据库备份恢复平台 - 后端服务`);
  console.log(`========================================`);
  console.log(`服务地址: http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
  console.log(`数据库: ${process.env.DB_PATH || './data/app.sqlite'}`);
  console.log(`启动时间: ${new Date().toISOString()}`);
  console.log(`========================================\n`);
});
