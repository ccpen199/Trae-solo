require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { initDatabase } = require('./database');
const { createRoutes } = require('./routes');

function checkPort(port) {
  try {
    const result = execSync(`lsof -ti tcp:${port} 2>/dev/null || true`, { encoding: 'utf8' }).trim();
    return result ? result.split('\n') : [];
  } catch {
    return [];
  }
}

function getProjectNumber() {
  const projectId = process.env.PROJECT_ID || 'may-63390';
  const match = projectId.match(/may-(\d+)/);
  if (match) {
    const num = match[1];
    return num.padStart(4, '0').slice(-4);
  }
  return '6339';
}

function findAvailablePort(basePort, slot, tail4) {
  return basePort + slot * 1000 + parseInt(tail4);
}

function updateEnvPort(key, port) {
  const envPath = path.join(__dirname, '..', '..', '.env');
  let content = fs.readFileSync(envPath, 'utf8');
  const regex = new RegExp(`^${key}=.*$`, 'm');
  content = content.replace(regex, `${key}=${port}`);
  fs.writeFileSync(envPath, content);
  process.env[key] = port.toString();
}

function initPorts() {
  const tail4 = getProjectNumber();
  const slots = [0, 1, 2, 3, 4, 5];
  
  let backendPort = parseInt(process.env.BACKEND_PORT) || 50000 + parseInt(tail4);
  
  let backendAvailable = checkPort(backendPort).length === 0;
  
  if (!backendAvailable) {
    let found = false;
    for (const slot of slots) {
      const testBackend = findAvailablePort(50000, slot, tail4);
      
      if (checkPort(testBackend).length === 0) {
        backendPort = testBackend;
        updateEnvPort('BACKEND_PORT', backendPort);
        updateEnvPort('API_BASE_URL', `http://127.0.0.1:${backendPort}/api`);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.error('所有后端端口槽位均被占用，请手动释放端口后重试');
      process.exit(1);
    }
  }
  
  return { backendPort };
}

const { backendPort } = initPorts();
const frontendPort = parseInt(process.env.FRONTEND_PORT) || 43390;

const db = initDatabase();

const app = express();

app.use(helmet());
app.use(cors({
  origin: `http://127.0.0.1:${frontendPort}`,
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));
app.use(morgan('combined'));
app.use(express.json());

app.use('/api', createRoutes(db));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(backendPort, '127.0.0.1', () => {
  console.log(`\n========================================`);
  console.log(`内部软件资产台账后端服务已启动`);
  console.log(`后端地址: http://127.0.0.1:${backendPort}`);
  console.log(`API 地址: http://127.0.0.1:${backendPort}/api`);
  console.log(`数据库: ${path.join(__dirname, '..', 'data', 'app.sqlite')}`);
  console.log(`========================================\n`);
});
