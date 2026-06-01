require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const applicationsRouter = require('./routes/applications');
const tasksRouter = require('./routes/tasks');
const changeOrdersRouter = require('./routes/changeOrders');
const auditsRouter = require('./routes/audits');

require('./database');

const app = express();
const envPath = path.join(__dirname, '../../.env');

function getPortConfig() {
  let frontendPort, backendPort;
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/BACKEND_PORT=(\d+)/);
    if (match) backendPort = parseInt(match[1]);
    const fmatch = envContent.match(/FRONTEND_PORT=(\d+)/);
    if (fmatch) frontendPort = parseInt(fmatch[1]);
  }
  
  return { frontendPort, backendPort, envContent };
}

function isPortInUse(port) {
  try {
    execSync(`lsof -ti tcp:${port}`, { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

function getPortWithSlot(slot, tail4) {
  return {
    frontend: 40000 + slot * 1000 + tail4,
    backend: 50000 + slot * 1000 + tail4
  };
}

function findAvailablePort() {
  const projectName = path.basename(path.dirname(__dirname));
  const numMatch = projectName.match(/-(\d+)/);
  const numStr = numMatch ? numMatch[1] : '0000';
  const tail4 = parseInt(numStr.slice(-4).padStart(4, '0'));

  const { backendPort, envContent } = getPortConfig();

  if (backendPort && !isPortInUse(backendPort)) {
    return backendPort;
  }

  for (let slot = 0; slot <= 5; slot++) {
    const ports = getPortWithSlot(slot, tail4);
    if (!isPortInUse(ports.backend)) {
      let newEnvContent = envContent;
      newEnvContent = newEnvContent.replace(/FRONTEND_PORT=\d+/, `FRONTEND_PORT=${ports.frontend}`);
      newEnvContent = newEnvContent.replace(/BACKEND_PORT=\d+/, `BACKEND_PORT=${ports.backend}`);
      newEnvContent = newEnvContent.replace(/API_BASE_URL=http:\/\/127\.0\.0\.1:\d+/, `API_BASE_URL=http://127.0.0.1:${ports.backend}`);
      fs.writeFileSync(envPath, newEnvContent);
      console.log(`端口已更新: FRONTEND_PORT=${ports.frontend}, BACKEND_PORT=${ports.backend}`);
      return ports.backend;
    }
  }

  console.error('所有端口槽位均被占用，请手动释放端口或调整配置');
  process.exit(1);
}

const PORT = findAvailablePort();

app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/applications', applicationsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/change-orders', changeOrdersRouter);
app.use('/api/audit', auditsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`
============================================
  分布式任务调度平台 - 后端服务
  地址: http://127.0.0.1:${PORT}
  数据库: SQLite (./backend/data/app.sqlite)
============================================
  `);
});
