require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const caseRoutes = require('./routes/cases');
const evidenceRoutes = require('./routes/evidences');
const documentRoutes = require('./routes/documents');
const accountingRoutes = require('./routes/accounting');

require('./database/init');

const app = express();
const PORT = parseInt(process.env.PORT) || 11090;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:21090';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:21090'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/evidences', evidenceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/accounting', accountingRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/users', (req, res) => {
  const db = require('./database/init');
  db.all(
    'SELECT id, username, name, role, phone, email FROM users ORDER BY name',
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '查询用户失败' });
      }
      res.json(rows);
    }
  );
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`法律案件管理系统 - 后端服务已启动`);
  console.log(`端口: ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`前端地址: ${FRONTEND_URL}`);
  console.log(`========================================`);
});
