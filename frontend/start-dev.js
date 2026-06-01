import 'dotenv/config';
import net from 'net';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = '127.0.0.1';
const PORT = parseInt(process.env.FRONTEND_PORT || '43391');
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '53391');
const projectDir = path.resolve(__dirname, '..');

function checkPortAvailable(host, port) {
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

function getProjectProcesses(port) {
  const processes = [];
  const currentPid = process.pid;
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

        const isProject = cwd.startsWith(projectDir) || cmdline.includes('may-63391') || cmdline.includes('vite');
        if (isProject) {
          processes.push({ pid, cwd, cmdline });
        }
      } catch {
        continue;
      }
    }
  } catch {}
  return processes;
}

async function cleanupProjectProcesses(port) {
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

async function startFrontend() {
  const tail4 = 3391;
  const portSlots = [40000, 41000, 42000, 43000, 44000, 45000].map(base => base + tail4);
  
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
    console.error(`ERROR: All frontend port slots are occupied.`);
    process.exit(1);
  }

  if (port !== PORT) {
    const envPath = path.join(projectDir, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/FRONTEND_PORT=\d+/, `FRONTEND_PORT=${port}`);
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated .env with new frontend port ${port}`);
  }

  console.log(`Starting frontend on http://${HOST}:${port}`);
  
  const vite = spawn('npx', ['vite', '--host', HOST, '--port', String(port), '--strictPort'], {
    cwd: path.join(projectDir, 'frontend'),
    env: {
      ...process.env,
      FRONTEND_PORT: String(port),
      BACKEND_PORT: String(BACKEND_PORT),
    },
  });

  const pidFile = path.join(projectDir, 'logs', 'frontend.pid');
  fs.writeFileSync(pidFile, String(vite.pid));

  vite.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  vite.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  vite.on('exit', (code) => {
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
    process.exit(code || 0);
  });

  process.on('SIGTERM', () => {
    vite.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    vite.kill('SIGINT');
  });
}

startFrontend().catch(err => {
  console.error('Failed to start frontend:', err);
  process.exit(1);
});
