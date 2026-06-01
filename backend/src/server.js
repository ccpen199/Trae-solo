require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase } = require('./db/database');

const shipsRouter = require('./routes/ships');
const schedulesRouter = require('./routes/schedules');
const resourcesRouter = require('./routes/resources');
const berthsRouter = require('./routes/berths');
const adjustmentsRouter = require('./routes/adjustments');

const app = express();
const PORT = process.env.BACKEND_PORT || 58821;
const HOST = '127.0.0.1';

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48821}`,
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/ships', shipsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/berths', berthsRouter);
app.use('/api/adjustments', adjustmentsRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '船舶靠泊计划系统 API 运行正常' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

initDatabase();

app.listen(PORT, HOST, () => {
  console.log(`========================================`);
  console.log(`  船舶靠泊计划系统 - 后端服务`);
  console.log(`========================================`);
  console.log(`  监听地址: http://${HOST}:${PORT}`);
  console.log(`  健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(`========================================`);
});
