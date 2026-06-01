require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = parseInt(process.env.BACKEND_PORT) || 53488;
const PROJECT_DIR = path.resolve(__dirname, '../../');

function checkPort(port) {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null | head -n1`, (err, stdout) => {
      if (stdout && stdout.trim()) {
        resolve(stdout.trim());
      } else {
        resolve(null);
      }
    });
  });
}

function getProcessInfo(pid) {
  const { execSync } = require('child_process');
  let cwd = '';
  let cmd = '';

  try {
    const cwdOutput = execSync(`lsof -a -p ${pid} -d cwd -Fn 2>/dev/null`).toString();
    const cwdLine = cwdOutput.split('\n').find(line => line.startsWith('n'));
    cwd = cwdLine ? cwdLine.slice(1).trim() : '';
  } catch (e) {
    cwd = '';
  }

  try {
    cmd = execSync(`ps -o command= -p ${pid}`).toString().trim();
  } catch (e) {
    cmd = '';
  }

  return { cwd, cmd };
}

function isProjectProcess(pid) {
  if (!pid) return false;
  return getProcessInfo(pid).cwd.startsWith(PROJECT_DIR);
}

function updateEnvPort(newFrontendPort, newBackendPort) {
  const envPath = path.join(PROJECT_DIR, '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(/FRONTEND_PORT=\d+/, `FRONTEND_PORT=${newFrontendPort}`);
  envContent = envContent.replace(/BACKEND_PORT=\d+/, `BACKEND_PORT=${newBackendPort}`);
  envContent = envContent.replace(/API_BASE_URL=http:\/\/127\.0\.0\.1:\d+\/api/, `API_BASE_URL=http://127.0.0.1:${newBackendPort}/api`);
  envContent = envContent.replace(/VITE_API_BASE_URL=http:\/\/127\.0\.0\.1:\d+\/api/, `VITE_API_BASE_URL=http://127.0.0.1:${newBackendPort}/api`);
  fs.writeFileSync(envPath, envContent);
  process.env.FRONTEND_PORT = newFrontendPort;
  process.env.BACKEND_PORT = newBackendPort;
  process.env.API_BASE_URL = `http://127.0.0.1:${newBackendPort}/api`;
  process.env.VITE_API_BASE_URL = `http://127.0.0.1:${newBackendPort}/api`;
}

function getProjectNumber() {
  const dirName = path.basename(PROJECT_DIR);
  const match = dirName.match(/-(\d+)$/);
  if (match) {
    const numStr = match[1];
    return parseInt(numStr.slice(-4).padStart(4, '0'));
  }
  return 3488;
}

async function findAvailablePort() {
  const tail4 = getProjectNumber();
  const slots = [0, 1000, 2000, 3000, 4000, 5000];
  
  for (const slot of slots) {
    const backendPort = 50000 + slot + tail4;
    const frontendPort = 40000 + slot + tail4;
    
    const backendPid = await checkPort(backendPort);
    const frontendPid = await checkPort(frontendPort);
    const frontendPidInProject = frontendPid && isProjectProcess(frontendPid);
    
    if (!backendPid && (!frontendPid || frontendPidInProject)) {
      const envFrontendPort = parseInt(process.env.FRONTEND_PORT);
      const envBackendPort = parseInt(process.env.BACKEND_PORT);
      if (slot > 0 || envFrontendPort !== frontendPort || envBackendPort !== backendPort) {
        if (slot > 0) {
          console.log(`使用备用端口槽位 ${slot}: 前端 ${frontendPort}, 后端 ${backendPort}`);
        } else {
          console.log(`使用公式端口: 前端 ${frontendPort}, 后端 ${backendPort}`);
        }
        updateEnvPort(frontendPort, backendPort);
      }
      if (frontendPidInProject) {
        console.log(`前端端口 ${frontendPort} 已由本项目进程占用，后端继续使用同一槽位`);
      }
      return { backendPort, frontendPort };
    } else {
      console.log(`槽位 ${slot} 端口已占用: 前端 ${frontendPort}(PID:${frontendPid || 'free'}), 后端 ${backendPort}(PID:${backendPid || 'free'})`);
      
      if (backendPid) {
        try {
          const { cwd, cmd } = getProcessInfo(backendPid);
          if (cwd.startsWith(PROJECT_DIR)) {
            console.log(`发现本项目进程，终止 PID: ${backendPid}`);
            process.kill(parseInt(backendPid));
            await new Promise(r => setTimeout(r, 1000));
            return { backendPort, frontendPort: frontendPort };
          } else {
            console.log(`端口 ${backendPort} 被其他项目占用: cwd=${cwd}, cmd=${cmd.substring(0, 60)}...`);
          }
        } catch (e) {
          console.log(`无法确认端口 ${backendPort} 归属，跳过`);
        }
      }
    }
  }
  
  throw new Error('所有端口槽位均被占用，请手动释放端口后重试');
}

async function startServer() {
  try {
    const { backendPort } = await findAvailablePort();
    const actualPort = backendPort || PORT;
    
    const app = express();
    
    app.use(cors({
      origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 43488}`, `http://localhost:${process.env.FRONTEND_PORT || 43488}`],
      credentials: true
    }));
    
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    
    app.use('/uploads', express.static(path.join(PROJECT_DIR, 'data', 'uploads')));
    
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      });
    });
    
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/goals', require('./routes/goals'));
    app.use('/api/execution', require('./routes/execution'));
    app.use('/api/deviation', require('./routes/deviation'));
    app.use('/api/export', require('./routes/export'));
    app.use('/api/admin', require('./routes/admin'));
    
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({
        error: err.message || '服务器内部错误',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    });
    
    app.use((req, res) => {
      res.status(404).json({ error: '接口不存在' });
    });
    
    const server = app.listen(actualPort, HOST, () => {
      console.log(`\n========================================`);
      console.log(`🚀 后端服务已启动`);
      console.log(`📍 地址: http://${HOST}:${actualPort}`);
      console.log(`🔌 健康检查: http://${HOST}:${actualPort}/api/health`);
      console.log(`📁 项目目录: ${PROJECT_DIR}`);
      console.log(`========================================\n`);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`端口 ${actualPort} 已被占用，请检查并释放端口`);
        process.exit(1);
      }
      throw err;
    });
    
    process.on('SIGTERM', () => {
      console.log('收到 SIGTERM 信号，正在关闭服务器...');
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('收到 SIGINT 信号，正在关闭服务器...');
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
    });
    
  } catch (err) {
    console.error('启动失败:', err.message);
    process.exit(1);
  }
}

startServer();
