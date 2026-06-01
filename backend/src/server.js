require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.BACKEND_PORT || 58805;

app.use(cors({
  origin: `http://localhost:${process.env.FRONTEND_PORT || 48805}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const routesPath = path.join(__dirname, 'routes');
if (fs.existsSync(routesPath)) {
  fs.readdirSync(routesPath).forEach(file => {
    if (file.endsWith('.js')) {
      const route = require(path.join(routesPath, file));
      const routeName = file.replace('.js', '').replace('-routes', '');
      app.use(`/api/${routeName}`, route);
      console.log(`路由已加载: /api/${routeName}`);
    }
  });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`保单续期系统后端服务已启动`);
  console.log(`监听地址: http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;
