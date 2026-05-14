require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 19980;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 29980;

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors({
  origin: [`http://localhost:${FRONTEND_PORT}`, `http://127.0.0.1:${FRONTEND_PORT}`],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const db = require('./database');
const routes = require('./routes');

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    data: null
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务正常', data: { port: PORT, frontendPort: FRONTEND_PORT } });
});

db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`  后端服务启动成功!`);
    console.log(`  后端地址: http://localhost:${PORT}`);
    console.log(`  前端地址: http://localhost:${FRONTEND_PORT}`);
    console.log(`  数据库: ${path.resolve(dataDir, 'app.sqlite')}`);
    console.log(`========================================`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
