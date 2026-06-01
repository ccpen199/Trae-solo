const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { initDatabase } = require('./database');
const clientsRouter = require('./routes/clients');
const requirementsRouter = require('./routes/requirements');
const nameApprovalsRouter = require('./routes/nameApprovals');
const materialsRouter = require('./routes/materials');
const progressRouter = require('./routes/progress');
const acceptanceRouter = require('./routes/acceptance');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.BACKEND_PORT || 56881;

app.use(cors());
app.use(express.json());

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/clients', clientsRouter);
app.use('/api/requirements', requirementsRouter);
app.use('/api/name-approvals', nameApprovalsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/acceptance', acceptanceRouter);
app.use('/api/users', usersRouter);

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`工商注册服务平台后端服务运行在 http://127.0.0.1:${PORT}`);
});

module.exports = app;
