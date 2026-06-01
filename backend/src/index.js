require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { initDatabase, resetSampleData } = require('./database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const meetingRoutes = require('./routes/meetings');
const actionItemRoutes = require('./routes/actionItems');
const auditLogRoutes = require('./routes/auditLogs');

const app = express();
const PORT = process.env.BACKEND_PORT || 53362;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43362}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/action-items', actionItemRoutes);
app.use('/api/audit-logs', auditLogRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/reset-sample-data', (req, res) => {
  try {
    const result = resetSampleData();
    res.json(result);
  } catch (error) {
    console.error('Reset sample data error:', error);
    res.status(500).json({ error: '重置数据失败' });
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务已启动: http://127.0.0.1:${PORT}`);
});
