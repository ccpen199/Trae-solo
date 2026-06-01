import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import app from './app';
import { config, getFallbackPorts, validatePort } from './config';
import { getDatabase, closeDatabase } from './config/database';

function checkPort(port: number): number | null {
  try {
    const output = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null | head -n1`, { encoding: 'utf8' }).trim();
    if (output) {
      return parseInt(output);
    }
    return null;
  } catch {
    return null;
  }
}

function getProjectDir(): string {
  return process.cwd();
}

function isOurProcess(pid: number): boolean {
  try {
    const cwd = execSync(`ps -o cwd= -p ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim();
    const projectDir = getProjectDir();
    return cwd.startsWith(projectDir);
  } catch {
    return false;
  }
}

function killOurProcess(pid: number): void {
  try {
    if (isOurProcess(pid)) {
      execSync(`kill ${pid}`, { stdio: 'ignore' });
      console.log(`Killed our process PID ${pid}`);
    } else {
      console.log(`Skip killing PID ${pid}: not our project`);
    }
  } catch (err) {
    console.log(`Failed to kill PID ${pid}:`, err);
  }
}

function findAvailablePorts(): { frontend: number; backend: number } {
  const projectDir = getProjectDir();
  console.log(`Project directory: ${projectDir}`);

  for (let slot = 0; slot <= 5; slot++) {
    const ports = getFallbackPorts(slot);
    
    if (!validatePort(ports.frontend, 'frontend') || !validatePort(ports.backend, 'backend')) {
      continue;
    }

    const frontendPid = checkPort(ports.frontend);
    const backendPid = checkPort(ports.backend);

    if (frontendPid === null && backendPid === null) {
      if (slot > 0) {
        console.log(`Using fallback slot ${slot}: FRONTEND_PORT=${ports.frontend}, BACKEND_PORT=${ports.backend}`);
        updateEnvPorts(ports.frontend, ports.backend);
      }
      return ports;
    }

    if (frontendPid !== null) {
      if (isOurProcess(frontendPid)) {
        console.log(`Port ${ports.frontend} used by our process ${frontendPid}, killing...`);
        killOurProcess(frontendPid);
      } else {
        console.log(`Port ${ports.frontend} used by other process ${frontendPid}, trying next slot...`);
        continue;
      }
    }

    if (backendPid !== null) {
      if (isOurProcess(backendPid)) {
        console.log(`Port ${ports.backend} used by our process ${backendPid}, killing...`);
        killOurProcess(backendPid);
      } else {
        console.log(`Port ${ports.backend} used by other process ${backendPid}, trying next slot...`);
        continue;
      }
    }

    const waitStart = Date.now();
    while (Date.now() - waitStart < 3000) {
      if (checkPort(ports.frontend) === null && checkPort(ports.backend) === null) {
        if (slot > 0) {
          updateEnvPorts(ports.frontend, ports.backend);
        }
        return ports;
      }
      execSync('sleep 0.2', { stdio: 'ignore' });
    }
  }

  console.error('ERROR: All port slots are occupied by other projects!');
  console.error('Please free up ports or use a different project directory.');
  process.exit(1);
}

function updateEnvPorts(frontendPort: number, backendPort: number): void {
  const envPath = path.resolve(process.cwd(), '.env');
  let content = fs.readFileSync(envPath, 'utf8');
  
  content = content.replace(/^FRONTEND_PORT=.*$/m, `FRONTEND_PORT=${frontendPort}`);
  content = content.replace(/^BACKEND_PORT=.*$/m, `BACKEND_PORT=${backendPort}`);
  content = content.replace(/^VITE_API_BASE_URL=.*$/m, `VITE_API_BASE_URL=http://127.0.0.1:${backendPort}/api`);
  content = content.replace(/^API_BASE_URL=.*$/m, `API_BASE_URL=http://127.0.0.1:${backendPort}/api`);
  content = content.replace(/^CORS_ORIGIN=.*$/m, `CORS_ORIGIN=http://127.0.0.1:${frontendPort}`);
  
  fs.writeFileSync(envPath, content);
  
  process.env.FRONTEND_PORT = String(frontendPort);
  process.env.BACKEND_PORT = String(backendPort);
  process.env.VITE_API_BASE_URL = `http://127.0.0.1:${backendPort}/api`;
  process.env.API_BASE_URL = `http://127.0.0.1:${backendPort}/api`;
  process.env.CORS_ORIGIN = `http://127.0.0.1:${frontendPort}`;
  
  config.port = backendPort;
  config.frontendPort = frontendPort;
  config.corsOrigin = `http://127.0.0.1:${frontendPort}`;
  
  console.log(`Updated .env with ports: FRONTEND=${frontendPort}, BACKEND=${backendPort}`);
}

function startServer(): void {
  const ports = findAvailablePorts();
  const backendPort = ports.backend;
  const frontendPort = ports.frontend;

  try {
    getDatabase();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }

  const server = app.listen(backendPort, config.host, () => {
    console.log('========================================');
    console.log('  个人资产负债管理系统 - 后端服务');
    console.log('========================================');
    console.log(`  后端地址: http://${config.host}:${backendPort}`);
    console.log(`  前端地址: http://${config.host}:${frontendPort}`);
    console.log(`  健康检查: http://${config.host}:${backendPort}/api/health`);
    console.log(`  API 前缀: http://${config.host}:${backendPort}/api`);
    console.log(`  数据库: ${path.resolve(process.cwd(), 'data', 'app.sqlite')}`);
    console.log('========================================');
    console.log(`  测试账号: admin / admin123`);
    console.log(`  测试账号: user / user123`);
    console.log('========================================');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${backendPort} is already in use`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      throw err;
    }
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed');
      closeDatabase();
      console.log('Database connection closed');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('Forced shutdown after 10 seconds');
      closeDatabase();
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    closeDatabase();
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

startServer();
