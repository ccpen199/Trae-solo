require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const changeOrderRoutes = require('./routes/changeOrders');
const executionRoutes = require('./routes/execution');
const auditRoutes = require('./routes/audit');
const lowcodeRoutes = require('./routes/lowcode');

require('./models/database');

const app = express();
const PORT = process.env.BACKEND_PORT || 54392;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/change-orders', changeOrderRoutes);
app.use('/api/execution', executionRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/lowcode', lowcodeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 低代码审批表单平台已启动: http://127.0.0.1:${PORT}`);
  console.log(`📊 API健康检查: http://127.0.0.1:${PORT}/api/health`);
});

module.exports = app;
