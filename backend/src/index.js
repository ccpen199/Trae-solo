require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

const PORT = process.env.PORT || 12218;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:22218',
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/evaluations', require('./routes/evaluations'));
app.use('/api/class-fees', require('./routes/classFees'));
app.use('/api/feedbacks', require('./routes/feedbacks'));
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/user/info', require('./middleware/auth').authenticate, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    name: req.user.name,
    role: req.user.role,
    email: req.user.email,
    studentId: req.user.studentId,
    department: req.user.department,
    classId: req.user.classId
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

async function startServer() {
  try {
    await prisma.$connect();
    console.log('数据库连接成功');
    
    app.listen(PORT, () => {
      console.log(`系部事务管理系统后端已启动`);
      console.log(`访问地址: http://localhost:${PORT}`);
      console.log(`API文档: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
