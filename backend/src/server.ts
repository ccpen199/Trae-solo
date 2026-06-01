import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import net from 'net';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { corsMiddleware } from './middleware/cors.js';
import { apiLogMiddleware } from './middleware/apiLog.js';
import { initTables, seedData } from './db.js';

import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';
import environmentRoutes from './routes/environments.js';
import versionRoutes from './routes/versions.js';
import secretRoutes from './routes/secrets.js';
import taskRoutes from './routes/tasks.js';
import vulnerabilityRoutes from './routes/vulnerabilities.js';
import alertRoutes from './routes/alerts.js';
import changeRoutes from './routes/changes.js';
import logRoutes from './routes/logs.js';
import auditRoutes from './routes/audit.js';
import statsRoutes from './routes/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = '127.0.0.1';
const PORT = parseInt(process.env.BACKEND_PORT || '53391');

const pidFile = path.join(__dirname, '..', '..', 'logs', 'backend.pid');

function checkPortAvailable(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, host);
  });
}

function getProjectProcesses(port: number): Array<{ pid: number; cwd: string; cmdline: string }> {
  const projectDir = path.resolve(__dirname, '..', '..');
  const processes: Array<{ pid: number; cwd: string; cmdline: string }> = [];
  const isMacOS = process.platform === 'darwin';
  const currentPid = process.pid;

  if (isMacOS) {
    try {
      const { execSync } = require('child_process');
      const output = execSync(`lsof -ti:${port} -sTCP:LISTEN 2>/dev/null || true`, { encoding: 'utf8' });
      const pids = output.trim().split('\n').filter(Boolean);

      for (const pidStr of pids) {
        const pid = parseInt(pidStr);
        if (isNaN(pid) || pid === currentPid) continue;

        try {
          const psOutput = execSync(`ps -p ${pid} -o cwd=,command= 2>/dev/null || true`, { encoding: 'utf8' }).trim();
          const parts = psOutput.split(/\s+/);
          const cwd = parts[0] || projectDir;
          const cmdline = parts.slice(1).join(' ') || '';

          const isProject = cwd.startsWith(projectDir) || cmdline.includes('may-63391') || cmdline.includes('backend/src/server') || cmdline.includes('tsx');
          if (isProject) {
            processes.push({ pid, cwd, cmdline });
          }
        } catch {
          continue;
        }
      }
    } catch {}
  } else {
    try {
      const procDirs = fs.readdirSync('/proc').filter(d => /^\d+$/.test(d));

      for (const pidStr of procDirs) {
        const pid = parseInt(pidStr);
        if (pid === currentPid) continue;
        try {
          const cwd = fs.readlinkSync(`/proc/${pid}/cwd`);
          const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ');

          const isProject = cwd.startsWith(projectDir) || cmdline.includes('may-63391') || cmdline.includes('backend/src/server');
          const isPortInUse = cmdline.includes(`:${port}`) || cmdline.includes(`${port}`);

          if (isProject && isPortInUse) {
            processes.push({ pid, cwd, cmdline });
          }
        } catch {
          continue;
        }
      }
    } catch {}
  }

  if (processes.length === 0) {
    const existingPid = fs.existsSync(pidFile) ? parseInt(fs.readFileSync(pidFile, 'utf8').trim()) : null;
    if (existingPid && existingPid !== currentPid) {
      try {
        process.kill(existingPid, 0);
        processes.push({ pid: existingPid, cwd: projectDir, cmdline: 'backend' });
      } catch {}
    }
  }

  return processes;
}

async function cleanupProjectProcesses(port: number) {
  const projectDir = path.resolve(__dirname, '..', '..');
  const processes = getProjectProcesses(port);

  for (const proc of processes) {
    if (proc.cwd.startsWith(projectDir) || proc.cmdline.includes('may-63391')) {
      try {
        console.log(`Terminating project process PID ${proc.pid}`);
        process.kill(proc.pid, 'SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.log(`Failed to terminate PID ${proc.pid}: ${err}`);
      }
    }
  }
}

async function startServer() {
  console.log('Initializing database...');
  initTables();
  seedData();
  console.log('Database initialized successfully.');

  const tail4 = 3391;
  const portSlots = [50000, 51000, 52000, 53000, 54000, 55000].map(base => base + tail4);
  
  let port = PORT;
  let portAvailable = await checkPortAvailable(HOST, port);
  let slotIndex = 0;

  while (!portAvailable && slotIndex < portSlots.length) {
    console.log(`Port ${port} is in use. Checking for project processes...`);
    await cleanupProjectProcesses(port);

    await new Promise(resolve => setTimeout(resolve, 1000));
    portAvailable = await checkPortAvailable(HOST, port);

    if (!portAvailable) {
      slotIndex++;
      if (slotIndex < portSlots.length) {
        port = portSlots[slotIndex];
        console.log(`Trying alternative port ${port} (slot ${slotIndex})...`);
        portAvailable = await checkPortAvailable(HOST, port);
      }
    }
  }

  if (!portAvailable) {
    console.error(`ERROR: All port slots are occupied.`);
    console.error(`Please free one of these ports or kill the occupying process:`);
    for (const slot of portSlots) {
      try {
        const { execSync } = require('child_process');
        const pid = execSync(`lsof -ti:${slot} -sTCP:LISTEN 2>/dev/null || true`, { encoding: 'utf8' }).trim();
        if (pid) {
          const psInfo = execSync(`ps -p ${pid} -o pid=,cwd=,command= 2>/dev/null || true`, { encoding: 'utf8' }).trim();
          console.error(`  Port ${slot}: PID ${pid} - ${psInfo}`);
        }
      } catch {}
    }
    process.exit(1);
  }

  if (port !== PORT) {
    const envPath = path.join(__dirname, '..', '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/BACKEND_PORT=\d+/, `BACKEND_PORT=${port}`);
    envContent = envContent.replace(/VITE_API_BASE_URL=http:\/\/127\.0\.0\.1:\d+/, `VITE_API_BASE_URL=http://127.0.0.1:${port}`);
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated .env with new port ${port}`);
  }

  const app = express();

  app.use(corsMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(apiLogMiddleware);

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api', environmentRoutes);
  app.use('/api', versionRoutes);
  app.use('/api', secretRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/vulnerabilities', vulnerabilityRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/changes', changeRoutes);
  app.use('/api/logs', logRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/stats', statsRoutes);

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  });

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found', path: req.path });
  });

  const server = app.listen(port, HOST, () => {
    console.log(`🚀 Server running at http://${HOST}:${port}`);
    console.log(`📁 API base: http://${HOST}:${port}/api`);

    fs.writeFileSync(pidFile, String(process.pid));

    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down...');
      server.close(() => {
        if (fs.existsSync(pidFile)) {
          fs.unlinkSync(pidFile);
        }
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down...');
      server.close(() => {
        if (fs.existsSync(pidFile)) {
          fs.unlinkSync(pidFile);
        }
        process.exit(0);
      });
    });
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
