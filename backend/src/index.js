require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.BACKEND_PORT || 23138;

app.use(cors({
  origin: ['http://localhost:33138', 'http://localhost:23138'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

const initDB = require('./database/init');
initDB();

const tasksRouter = require('./routes/tasks');
const executionRouter = require('./routes/execution');
const auditRouter = require('./routes/audit');
const dealersRouter = require('./routes/dealers');
const uploadRouter = require('./routes/upload');

app.use('/api/tasks', tasksRouter);
app.use('/api/execution', executionRouter);
app.use('/api/audit', auditRouter);
app.use('/api/dealers', dealersRouter);
app.use('/api/upload', uploadRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
});

app.listen(PORT, () => {
  console.log(`✅ 后端服务已启动: http://localhost:${PORT}`);
  console.log(`📍 API 地址: http://localhost:${PORT}/api`);
});
