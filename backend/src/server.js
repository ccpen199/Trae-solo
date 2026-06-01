require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const employeesRouter = require('./routes/employees');
const positionsRouter = require('./routes/positions');
const trainingRouter = require('./routes/training');
const authorizationsRouter = require('./routes/authorizations');

const app = express();
const PORT = process.env.BACKEND_PORT || 58842;
const HOST = '127.0.0.1';

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48842}`,
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('./database');

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/employees', employeesRouter);
app.use('/api/positions', positionsRouter);
app.use('/api/training', trainingRouter);
app.use('/api/authorizations', authorizationsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, HOST, () => {
  console.log(`后端服务运行在 http://${HOST}:${PORT}`);
  console.log(`健康检查: http://${HOST}:${PORT}/api/health`);
});
