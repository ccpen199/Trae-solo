require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { auditMiddleware } = require('./middleware/audit');

const expertsRouter = require('./routes/experts');
const projectsRouter = require('./routes/projects');
const notificationsRouter = require('./routes/notifications');
const auditRouter = require('./routes/audit');

const app = express();
const PORT = process.env.BACKEND_PORT || 58896;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48896}`,
  credentials: true
}));

app.use(express.json());
app.use(auditMiddleware);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/experts', expertsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/audit', auditRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`专家库抽取系统后端服务已启动`);
  console.log(`监听地址: http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
