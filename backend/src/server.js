require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const fleetsRouter = require('./routes/fleets');
const crewRouter = require('./routes/crew');
const trainsRouter = require('./routes/trains');
const schedulingRouter = require('./routes/scheduling');
const shiftChangesRouter = require('./routes/shiftChanges');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.BACKEND_PORT || 53446;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43446}`,
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/fleets', fleetsRouter);
app.use('/api/crew', crewRouter);
app.use('/api/trains', trainsRouter);
app.use('/api/scheduling', schedulingRouter);
app.use('/api/shift-changes', shiftChangesRouter);
app.use('/api/reports', reportsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务启动成功: http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
