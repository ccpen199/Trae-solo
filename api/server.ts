/**
 * local server entry file, for local development
 */
import 'dotenv/config';
import app from './app.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.resolve(__dirname, '..');

function getPortConfig() {
  const tail4 = '9041';
  const slots = [
    { frontend: 40000 + parseInt(tail4), backend: 50000 + parseInt(tail4) },
    { frontend: 41000 + parseInt(tail4), backend: 51000 + parseInt(tail4) },
    { frontend: 42000 + parseInt(tail4), backend: 52000 + parseInt(tail4) },
    { frontend: 43000 + parseInt(tail4), backend: 53000 + parseInt(tail4) },
    { frontend: 44000 + parseInt(tail4), backend: 54000 + parseInt(tail4) },
    { frontend: 45000 + parseInt(tail4), backend: 55000 + parseInt(tail4) },
  ];
  return { tail4, slots };
}

function checkPortOccupied(port: number): boolean {
  try {
    const { execSync } = require('child_process');
    const result = execSync(`lsof -ti tcp:${port}`, { stdio: 'pipe' }).toString().trim();
    return result.length > 0;
  } catch {
    return false;
  }
}

function getPortOwnerPid(port: number): string | null {
  try {
    const { execSync } = require('child_process');
    const result = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t | head -n1`, { stdio: 'pipe' }).toString().trim();
    return result || null;
  } catch {
    return null;
  }
}

function isPortOwnedByProject(port: number, projectDir: string): boolean {
  const pid = getPortOwnerPid(port);
  if (!pid) return false;
  try {
    const { execSync } = require('child_process');
    const cwd = execSync(`ps -o cwd= -p ${pid}`, { stdio: 'pipe' }).toString().trim();
    return cwd.startsWith(projectDir);
  } catch {
    return false;
  }
}

function killPortIfOwned(port: number, projectDir: string): void {
  const pid = getPortOwnerPid(port);
  if (!pid) return;
  if (isPortOwnedByProject(port, projectDir)) {
    try {
      const { execSync } = require('child_process');
      execSync(`kill ${pid}`, { stdio: 'pipe' });
      console.log(`Killed process ${pid} on port ${port} (owned by project)`);
    } catch (e) {
      console.error(`Failed to kill process ${pid}:`, e);
    }
  }
}

function updateEnvFile(frontendPort: number, backendPort: number): void {
  const envPath = path.join(PROJECT_DIR, '.env');
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8');
  }
  const lines = content.split('\n');
  const updates: Record<string, string> = {
    'FRONTEND_PORT': String(frontendPort),
    'BACKEND_PORT': String(backendPort),
    'VITE_API_BASE_URL': `http://127.0.0.1:${backendPort}/api`,
  };
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }
  fs.writeFileSync(envPath, content.trim() + '\n');
  process.env.FRONTEND_PORT = String(frontendPort);
  process.env.BACKEND_PORT = String(backendPort);
  process.env.VITE_API_BASE_URL = `http://127.0.0.1:${backendPort}/api`;
}

function findAvailablePorts(): { frontendPort: number; backendPort: number } {
  const { slots } = getPortConfig();
  for (const slot of slots) {
    const frontendOccupied = checkPortOccupied(slot.frontend);
    const backendOccupied = checkPortOccupied(slot.backend);
    if (!frontendOccupied && !backendOccupied) {
      return { frontendPort: slot.frontend, backendPort: slot.backend };
    }
    if (frontendOccupied && isPortOwnedByProject(slot.frontend, PROJECT_DIR)) {
      killPortIfOwned(slot.frontend, PROJECT_DIR);
    }
    if (backendOccupied && isPortOwnedByProject(slot.backend, PROJECT_DIR)) {
      killPortIfOwned(slot.backend, PROJECT_DIR);
    }
    if (!checkPortOccupied(slot.frontend) && !checkPortOccupied(slot.backend)) {
      return { frontendPort: slot.frontend, backendPort: slot.backend };
    }
  }
  console.error('ERROR: All port slots are occupied by other projects!');
  for (const slot of slots) {
    const fpid = getPortOwnerPid(slot.frontend);
    const bpid = getPortOwnerPid(slot.backend);
    if (fpid) console.error(`  Port ${slot.frontend}: PID ${fpid}`);
    if (bpid) console.error(`  Port ${slot.backend}: PID ${bpid}`);
  }
  console.error('Please free up ports or use a different project directory.');
  process.exit(1);
}

const { frontendPort, backendPort } = findAvailablePorts();
updateEnvFile(frontendPort, backendPort);

const HOST = '127.0.0.1';
const PORT = backendPort;

const server = app.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`);
  console.log(`Frontend will run on http://127.0.0.1:${frontendPort}`);
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;