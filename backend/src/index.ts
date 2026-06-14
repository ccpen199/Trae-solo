import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { execSync } from 'child_process';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PROJECT_DIR = path.resolve(__dirname, '../../');
const tail4 = parseInt('89067'.slice(-4).padStart(4, '0'));

function getProcessCwd(pid: number): string {
  try {
    const result = execSync(`pwdx ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim();
    const parts = result.split(':');
    return parts.length > 1 ? parts.slice(1).join(':').trim() : '';
  } catch (e) {
    return '';
  }
}

function isProcessBelongsToProject(pid: number): boolean {
  const cwd = getProcessCwd(pid);
  if (cwd && cwd.startsWith(PROJECT_DIR)) {
    return true;
  }
  try {
    const cmd = execSync(`ps -o command= -p ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim();
    if (cmd.includes(PROJECT_DIR)) {
      return true;
    }
  } catch (e) {}
  return false;
}

function checkBackendPort(port: number): boolean {
  try {
    const result = execSync(
      `lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null | head -n1`,
      { encoding: 'utf8' }
    ).trim();
    if (result) {
      const pid = parseInt(result);
      const cmd = execSync(`ps -o command= -p ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim();
      
      if (isProcessBelongsToProject(pid)) {
        console.log(`Killing existing backend process PID=${pid} on port ${port} (belongs to this project)`);
        execSync(`kill ${pid} 2>/dev/null`);
        execSync(`sleep 1`);
        return true;
      } else {
        console.log(`Port ${port} is occupied by PID=${pid} cmd=${cmd.substring(0, 80)}`);
        console.log('This process does not belong to current project, trying next slot...');
        return false;
      }
    }
    return true;
  } catch (e) {
    return true;
  }
}

function findBackendPort(): { frontendPort: number; backendPort: number } {
  const slots = [0, 1, 2, 3, 4, 5];
  let configuredFrontend = parseInt(process.env.FRONTEND_PORT || '49067');
  let configuredBackend = parseInt(process.env.BACKEND_PORT || '59067');
  
  for (const slot of slots) {
    const frontendPort = 40000 + slot * 1000 + tail4;
    const backendPort = 50000 + slot * 1000 + tail4;
    
    const backendAvailable = checkBackendPort(backendPort);
    
    if (backendAvailable) {
      if (frontendPort !== configuredFrontend || backendPort !== configuredBackend) {
        const envPath = path.resolve(__dirname, '../../.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/FRONTEND_PORT=\d+/, `FRONTEND_PORT=${frontendPort}`);
        envContent = envContent.replace(/BACKEND_PORT=\d+/, `BACKEND_PORT=${backendPort}`);
        envContent = envContent.replace(/VITE_API_BASE_URL=http:\/\/127\.0\.0\.1:\d+/, `VITE_API_BASE_URL=http://127.0.0.1:${backendPort}`);
        envContent = envContent.replace(/VITE_APP_URL=http:\/\/127\.0\.0\.1:\d+/, `VITE_APP_URL=http://127.0.0.1:${frontendPort}`);
        envContent = envContent.replace(/API_BASE_URL=http:\/\/127\.0\.0\.1:\d+/, `API_BASE_URL=http://127.0.0.1:${backendPort}`);
        fs.writeFileSync(envPath, envContent);
        console.log(`Updated .env with slot ${slot} ports: FRONTEND=${frontendPort}, BACKEND=${backendPort}`);
      }
      return { frontendPort, backendPort };
    }
  }
  
  console.error('All backend ports are occupied! Please free up some ports and try again.');
  process.exit(1);
}

const ports = findBackendPort();
const FRONTEND_PORT = ports.frontendPort;
const BACKEND_PORT = ports.backendPort;

import authRoutes from './routes/auth';
import resumeRoutes from './routes/resumes';
import templateRoutes from './routes/templates';
import importRoutes from './routes/import';
import qualityRoutes from './routes/quality';
import exportRoutes from './routes/export';
import deliveryRoutes from './routes/delivery';
import adminRoutes from './routes/admin';

const app = express();

const corsOptions = {
  origin: [
    `http://127.0.0.1:${FRONTEND_PORT}`,
    `http://localhost:${FRONTEND_PORT}`,
    'http://127.0.0.1:49067',
    'http://localhost:49067',
    'http://127.0.0.1:50067',
    'http://localhost:50067'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'resume-workbench-backend',
    ports: { frontend: FRONTEND_PORT, backend: BACKEND_PORT }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/import', importRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const server = app.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║       智能简历生成工作台 - 后端服务已启动                  ║
╠════════════════════════════════════════════════════════════╣
║  服务地址: http://127.0.0.1:${BACKEND_PORT}                      ║
║  健康检查: http://127.0.0.1:${BACKEND_PORT}/api/health           ║
║  前端地址: http://127.0.0.1:${FRONTEND_PORT}                      ║
║  数据库:   SQLite (data/app.sqlite)                        ║
╚════════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => process.exit(0));
});
