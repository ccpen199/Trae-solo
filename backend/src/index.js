import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import { setupRoutes } from './routes.js';
import './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const checkPort = (port) => {
  return new Promise((resolve) => {
    exec(`lsof -ti tcp:${port}`, (error, stdout) => {
      if (error) {
        resolve({ available: true });
      } else {
        const pids = stdout.trim().split('\n').filter(Boolean);
        resolve({ available: false, pids });
      }
    });
  });
};

const findAvailablePort = async (basePort, slot) => {
  const tail4 = 3358;
  const slotMultiplier = slot * 1000;
  const port = basePort + slotMultiplier + tail4;
  return port;
};

const updateEnvPort = (frontendPort, backendPort) => {
  let content = fs.readFileSync(envPath, 'utf8');
  content = content.replace(/FRONTEND_PORT=\d+/, `FRONTEND_PORT=${frontendPort}`);
  content = content.replace(/BACKEND_PORT=\d+/, `BACKEND_PORT=${backendPort}`);
  content = content.replace(/VITE_API_BASE_URL=http:\/\/127\.0\.0\.1:\d+/, `VITE_API_BASE_URL=http://127.0.0.1:${backendPort}`);
  fs.writeFileSync(envPath, content);
  process.env.FRONTEND_PORT = frontendPort;
  process.env.BACKEND_PORT = backendPort;
  process.env.VITE_API_BASE_URL = `http://127.0.0.1:${backendPort}`;
};

const startServer = async () => {
  let backendPort = parseInt(process.env.BACKEND_PORT) || 53358;
  let frontendPort = parseInt(process.env.FRONTEND_PORT) || 43358;
  
  for (let slot = 0; slot < 6; slot++) {
    const check = await checkPort(backendPort);
    if (check.available) break;
    
    if (slot < 5) {
      console.log(`端口 ${backendPort} 被占用，尝试备用槽位 ${slot + 1}...`);
      backendPort = await findAvailablePort(50000, slot + 1);
      frontendPort = await findAvailablePort(40000, slot + 1);
      updateEnvPort(frontendPort, backendPort);
    } else {
      console.error(`错误: 所有端口槽位均被占用！`);
      console.error(`后端端口检查结果: ${check.pids.join(', ')}`);
      console.error('请手动释放端口或使用其他端口');
      process.exit(1);
    }
  }

  const app = express();
  
  app.use(cors({
    origin: `http://127.0.0.1:${frontendPort}`,
    credentials: true
  }));
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  setupRoutes(app);
  
  const server = app.listen(backendPort, '127.0.0.1', () => {
    console.log(`========================================`);
    console.log(`AI 竞品分析 Agent 后端服务已启动`);
    console.log(`后端地址: http://127.0.0.1:${backendPort}`);
    console.log(`前端地址: http://127.0.0.1:${frontendPort}`);
    console.log(`API 健康检查: http://127.0.0.1:${backendPort}/api/health`);
    console.log(`========================================`);
  });

  process.on('SIGTERM', () => {
    console.log('收到 SIGTERM，正在关闭服务...');
    server.close(() => {
      console.log('服务已关闭');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('收到 SIGINT，正在关闭服务...');
    server.close(() => {
      console.log('服务已关闭');
      process.exit(0);
    });
  });
};

startServer().catch(console.error);
