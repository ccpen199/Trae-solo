import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb, insertInitialData } from './database/init.js';
import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';
import { authenticateToken } from './middleware/auth.js';
import { db } from './database/init.js';

const app = express();
const PORT = process.env.PORT || 11083;

app.use(cors({
  origin: ['http://localhost:11084', 'http://127.0.0.1:11084'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', (req, res, next) => {
  if (req.path === '/login' || req.path === '/register') {
    return next();
  }
  authenticateToken(req, res, next);
}, authRoutes);

app.use('/api/applications', authenticateToken, applicationRoutes);

app.get('/api/users', authenticateToken, (req, res) => {
  try {
    const { role } = req.query;
    let query = 'SELECT id, username, name, role, phone, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    const users = db.prepare(query).all(...params);
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/audit-logs', authenticateToken, async (req, res) => {
  try {
    const { getAuditLogs } = await import('./services/applicationService.js');
    const logs = getAuditLogs({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      action: req.query.action
    });
    res.json({ logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误'
  });
});

const startServer = async () => {
  try {
    console.log('Initializing database...');
    initDb();
    
    console.log('Inserting initial data...');
    insertInitialData();

    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`信贷管理系统后端服务已启动`);
      console.log(`========================================`);
      console.log(`服务地址: http://localhost:${PORT}`);
      console.log(`API 路径: http://localhost:${PORT}/api`);
      console.log(`健康检查: http://localhost:${PORT}/api/health`);
      console.log(`========================================`);
      console.log(`默认测试账号:`);
      console.log(`- 借款人: borrower1 / 123456`);
      console.log(`- 客户经理: manager1 / 123456`);
      console.log(`- 风控专家: risk1 / 123456`);
      console.log(`- 审批总监: approval1 / 123456`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
