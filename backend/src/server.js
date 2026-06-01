process.env.JWT_SECRET = 'evidence-catalog-secret-key-2024';
const PORT = 58818;

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const caseRoutes = require('./routes/cases');
const evidenceRoutes = require('./routes/evidence');
const groupRoutes = require('./routes/groups');
const exportRoutes = require('./routes/export');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');

const app = express();

app.use(cors({
  origin: ['http://localhost:48818', 'http://127.0.0.1:48818'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadDir = path.join(__dirname, '../../data/uploads');
const exportDir = path.join(__dirname, '../../data/exports');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`证据目录系统后端已启动: http://127.0.0.1:${PORT}`);
});

module.exports = app;
