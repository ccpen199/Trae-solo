require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const BACKEND_PORT = Number(process.env.BACKEND_PORT) || 51266;

const checkPort = (port) => {
  try {
    const result = require('child_process').execSync(`lsof -ti tcp:${port} 2>/dev/null || true`).toString().trim();
    if (result) {
      console.log(`端口 ${port} 已被占用，PID: ${result}`);
      return false;
    }
    return true;
  } catch (e) {
    return true;
  }
};

if (!checkPort(BACKEND_PORT)) {
  console.error(`端口 ${BACKEND_PORT} 被占用，请先释放端口或修改 .env 配置`);
  process.exit(1);
}

const app = express();

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 41266}`,
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/venues', require('./routes/venues'));
app.use('/api/games', require('./routes/games'));
app.use('/api', require('./routes/checkin'));
app.use('/api/exceptions', require('./routes/exceptions'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`后端服务启动成功: http://127.0.0.1:${BACKEND_PORT}`);
});
