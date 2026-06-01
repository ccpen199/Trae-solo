require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const farmersRouter = require('./routes/farmers');
const creditsRouter = require('./routes/credits');
const ordersRouter = require('./routes/orders');
const repaymentsRouter = require('./routes/repayments');
const dashboardRouter = require('./routes/dashboard');
const commonRouter = require('./routes/common');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '8765');

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.use('/api/farmers', farmersRouter);
app.use('/api/credits', creditsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/repayments', repaymentsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/common', commonRouter);

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '农资赊销授信系统API服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误', error: err.message });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     农资赊销授信系统 - 后端API服务                          ║
║                                                            ║
║     服务地址: http://localhost:${PORT}                         ║
║     健康检查: http://localhost:${PORT}/api/health               ║
║     数据库: SQLite                                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
