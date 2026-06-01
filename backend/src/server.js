require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const hotelsRouter = require('./routes/hotels');
const controlPlansRouter = require('./routes/controlPlans');
const teamsRouter = require('./routes/teams');
const settlementsRouter = require('./routes/settlements');

const app = express();
const PORT = process.env.BACKEND_PORT || 58944;

app.use(cors({
  origin: 'http://127.0.0.1:48944',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/hotels', hotelsRouter);
app.use('/api/control-plans', controlPlansRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/settlements', settlementsRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '控房系统后端服务运行正常', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`控房系统后端服务启动成功`);
  console.log(`服务地址: http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
