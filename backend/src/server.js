require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');

const materialsRouter = require('./routes/materials');
const auditsRouter = require('./routes/audits');
const risksRouter = require('./routes/risks');
const rectificationsRouter = require('./routes/rectifications');
const reportsRouter = require('./routes/reports');
const usersRouter = require('./routes/users');
const rulesRouter = require('./routes/rules');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 53363;
const HOST = '127.0.0.1';

app.use(cors({
  origin: `http://127.0.0.1:${parseInt(process.env.FRONTEND_PORT) || 43363}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

app.use('/api/materials', materialsRouter);
app.use('/api/audits', auditsRouter);
app.use('/api/risks', risksRouter);
app.use('/api/rectifications', rectificationsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/users', usersRouter);
app.use('/api/rules', rulesRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AI Compliance Audit Assistant API is running', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: '服务器内部错误', details: err.message });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' });
});

app.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   AI Compliance Audit Assistant - Backend Server              ║
║                                                               ║
║   🚀 Server running at:  http://${HOST}:${PORT}                 ║
║   📡 API Base URL:       http://${HOST}:${PORT}/api            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
