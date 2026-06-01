require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const envPath = path.join(__dirname, '../../.env');
let envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envConfig[key.trim()] = value.trim();
  });
}

const TAIL4 = envConfig.TAIL4 || '3395';
const SLOTS = [
  { f: 40000, b: 50000 },
  { f: 41000, b: 51000 },
  { f: 42000, b: 52000 },
  { f: 43000, b: 53000 },
  { f: 44000, b: 54000 },
  { f: 45000, b: 55000 }
];

function checkPort(port) {
  try {
    const result = execSync(`lsof -ti tcp:${port} 2>/dev/null || echo ''`, { encoding: 'utf8' }).trim();
    return result ? result.split('\n') : [];
  } catch (e) {
    return [];
  }
}

function isProjectProcess(pid, projectPath) {
  try {
    const cwd = execSync(`lsof -p ${pid} -a -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2-`, { encoding: 'utf8' }).trim();
    const cmdline = execSync(`ps -p ${pid} -o command= 2>/dev/null`, { encoding: 'utf8' }).trim();
    return cwd.includes(projectPath) || cmdline.includes('may-63395');
  } catch (e) {
    return false;
  }
}

function findAvailablePort() {
  const projectPath = path.resolve(__dirname, '../..');
  for (let i = 0; i < SLOTS.length; i++) {
    const frontendPort = SLOTS[i].f + parseInt(TAIL4);
    const backendPort = SLOTS[i].b + parseInt(TAIL4);
    
    const backendPids = checkPort(backendPort);
    let canUse = true;
    
    for (const pid of backendPids) {
      if (isProjectProcess(pid, projectPath)) {
        console.log(`端口 ${backendPort} 被本项目旧进程占用 (PID ${pid}), 终止中...`);
        try {
          process.kill(parseInt(pid), 'SIGTERM');
          execSync(`sleep 1`);
        } catch (e) {}
      } else {
        console.log(`端口 ${backendPort} 被其他项目占用 (PID ${pid}), 跳过`);
        canUse = false;
        break;
      }
    }
    
    if (canUse) {
      return { frontendPort, backendPort, slot: i };
    }
  }
  return null;
}

const ports = findAvailablePort();
if (!ports) {
  console.error('所有端口槽位均被占用，请手动释放端口后重试');
  process.exit(1);
}

if (ports.slot > 0) {
  envConfig.FRONTEND_PORT = ports.frontendPort;
  envConfig.BACKEND_PORT = ports.backendPort;
  envConfig.API_BASE_URL = `http://127.0.0.1:${ports.backendPort}`;
  envConfig.CORS_ORIGIN = `http://127.0.0.1:${ports.frontendPort}`;
  
  const newEnv = Object.entries(envConfig).map(([k, v]) => `${k}=${v}`).join('\n');
  fs.writeFileSync(envPath, newEnv + '\n');
  console.log(`端口冲突，已切换到第 ${ports.slot + 1} 备用槽位: ${ports.frontendPort}/${ports.backendPort}`);
}

const BACKEND_PORT = ports.backendPort;
const CORS_ORIGIN = envConfig.CORS_ORIGIN || `http://127.0.0.1:${ports.frontendPort}`;

const { authMiddleware } = require('./middleware/auth');
const { checkSecretExpiry } = require('./utils/audit');

const app = express();

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(authMiddleware);

app.use('/api/applications', require('./routes/applications'));
app.use('/api/environments', require('./routes/environments'));
app.use('/api/secrets', require('./routes/secrets'));
app.use('/api/change-orders', require('./routes/changeOrders'));
app.use('/api/execution-tasks', require('./routes/executionTasks'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

setInterval(checkSecretExpiry, 3600000);
checkSecretExpiry();

app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║          统一身份 SSO 平台 - 后端服务已启动                     ║
╠══════════════════════════════════════════════════════════════╣
║  服务地址: http://127.0.0.1:${BACKEND_PORT}                        ║
║  健康检查: http://127.0.0.1:${BACKEND_PORT}/api/health              ║
║  CORS 源: ${CORS_ORIGIN}                            ║
║  数据库: ${path.resolve(__dirname, '../data/app.sqlite')}  ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
