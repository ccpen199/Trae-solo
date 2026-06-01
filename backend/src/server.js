const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');

const liquorsRouter = require('./routes/liquors');
const recipesRouter = require('./routes/recipes');
const salesRouter = require('./routes/sales');
const stockTakeRouter = require('./routes/stockTake');
const commonRouter = require('./routes/common');

require('./database');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 58935;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48935}`,
  credentials: true
}));

app.use(express.json());

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'bar-inventory-backend'
  });
});

app.use('/api/liquors', liquorsRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/sales', salesRouter);
app.use('/api/stock-takes', stockTakeRouter);
app.use('/api', commonRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🚀 后端服务启动成功!`);
  console.log(`📍 地址: http://127.0.0.1:${PORT}`);
  console.log(`🔍 健康检查: http://127.0.0.1:${PORT}/api/health\n`);
});
