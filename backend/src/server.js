require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { initDatabase } = require('./database');
const { authenticate, errorHandler } = require('./middleware');

const interviewsRouter = require('./routes/interviews');
const transcriptsRouter = require('./routes/transcripts');
const speakersRouter = require('./routes/speakers');
const topicsRouter = require('./routes/topics');
const painPointsRouter = require('./routes/painPoints');
const evidenceRouter = require('./routes/evidence');
const summariesRouter = require('./routes/summaries');
const workflowRouter = require('./routes/workflow');
const usersRouter = require('./routes/users');
const uploadRouter = require('./routes/upload');

function checkPort(port) {
  try {
    const result = execSync(`lsof -ti tcp:${port} 2>/dev/null || true`, { encoding: 'utf8' });
    return result.trim() !== '';
  } catch {
    return false;
  }
}

function getPortWithFallback(basePort, slot, type) {
  const tail4 = 3359;
  const slots = [0, 1000, 2000, 3000, 4000, 5000];
  const base = type === 'frontend' ? 40000 : 50000;
  
  for (let i = slot; i < slots.length; i++) {
    const port = base + slots[i] + tail4;
    if (!checkPort(port)) {
      return { port, slot: i };
    }
  }
  return null;
}

function updateEnvFile(key, value) {
  const envPath = path.join(__dirname, '../../.env');
  let content = fs.readFileSync(envPath, 'utf8');
  const regex = new RegExp(`^${key}=.*`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
  fs.writeFileSync(envPath, content);
}

function startServer() {
  const app = express();
  
  initDatabase();
  
  let backendPort = parseInt(process.env.BACKEND_PORT || '53359');
  let currentSlot = 0;
  
  if (checkPort(backendPort)) {
    console.log(`端口 ${backendPort} 已被占用，尝试备用端口...`);
    const result = getPortWithFallback(backendPort, 1, 'backend');
    if (result) {
      backendPort = result.port;
      currentSlot = result.slot;
      updateEnvFile('BACKEND_PORT', backendPort);
      console.log(`使用备用端口: ${backendPort}`);
    } else {
      console.error('所有后端端口槽位均被占用！');
      process.exit(1);
    }
  }
  
  const frontendPort = 40000 + currentSlot * 1000 + 3359;
  app.use(cors({
    origin: [`http://127.0.0.1:${frontendPort}`, `http://localhost:${frontendPort}`],
    credentials: true
  }));
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  app.use(authenticate);
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), user: req.user });
  });
  
  app.use('/api/interviews', interviewsRouter);
  app.use('/api/interviews/:interviewId/transcripts', transcriptsRouter);
  app.use('/api/interviews/:interviewId/speakers', speakersRouter);
  app.use('/api/interviews/:interviewId/topics', topicsRouter);
  app.use('/api/interviews/:interviewId/pain-points', painPointsRouter);
  app.use('/api/interviews/:interviewId/evidence', evidenceRouter);
  app.use('/api/interviews/:interviewId/summaries', summariesRouter);
  app.use('/api/interviews/:interviewId/upload', uploadRouter);
  app.use('/api/workflow', workflowRouter);
  app.use('/api/users', usersRouter);
  
  app.use(errorHandler);
  
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found', path: req.path });
  });
  
  const server = app.listen(backendPort, '127.0.0.1', () => {
    console.log(`后端服务启动成功: http://127.0.0.1:${backendPort}`);
    console.log(`当前用户: ${process.env.USER || 'unknown'}`);
  });
  
  server.on('error', (err) => {
    console.error('服务器启动失败:', err.message);
    process.exit(1);
  });
}

startServer();
