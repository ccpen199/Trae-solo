const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getProjectNumber() {
  const dirName = path.basename(process.cwd());
  const match = dirName.match(/-(\d+)$/);
  if (!match) throw new Error('Cannot parse project number');
  return match[1];
}

function getTail4() {
  const numStr = getProjectNumber();
  return numStr.slice(-4).padStart(4, '0');
}

function getPorts(slot = 0) {
  const tail4 = parseInt(getTail4(), 10);
  const frontendBase = 40000 + slot * 1000;
  const backendBase = 50000 + slot * 1000;
  return {
    FRONTEND_PORT: frontendBase + tail4,
    BACKEND_PORT: backendBase + tail4
  };
}

function checkPort(port) {
  try {
    const result = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null`, { encoding: 'utf8' });
    return result.trim() ? true : false;
  } catch {
    return false;
  }
}

function getPortProcessInfo(port) {
  try {
    const pid = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null`, { encoding: 'utf8' }).trim();
    if (!pid) return null;
    const cwd = execSync(`ps -o cwd= -p ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim();
    const cmd = execSync(`ps -o command= -p ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim();
    return { pid, cwd, cmd };
  } catch {
    return null;
  }
}

function killProcessIfOwned(port, projectDir) {
  const info = getPortProcessInfo(port);
  if (!info) return true;
  const { pid, cwd, cmd } = info;
  if (cwd.startsWith(projectDir) || cmd.includes(projectDir)) {
    try {
      execSync(`kill ${pid} 2>/dev/null`);
      console.log(`Killed process ${pid} on port ${port}`);
      return true;
    } catch {
      return false;
    }
  }
  console.log(`Skipping kill: cwd=${cwd} cmd=${cmd} not owned by project`);
  return false;
}

function findAvailablePorts() {
  const projectDir = process.cwd();
  for (let slot = 0; slot <= 5; slot++) {
    const ports = getPorts(slot);
    const feUsed = checkPort(ports.FRONTEND_PORT);
    const beUsed = checkPort(ports.BACKEND_PORT);
    if (!feUsed && !beUsed) {
      const feInfo = getPortProcessInfo(ports.FRONTEND_PORT);
      const beInfo = getPortProcessInfo(ports.BACKEND_PORT);
      const feOwned = feInfo ? (feInfo.cwd.startsWith(projectDir) || feInfo.cmd.includes(projectDir)) : false;
      const beOwned = beInfo ? (beInfo.cwd.startsWith(projectDir) || beInfo.cmd.includes(projectDir)) : false;
      if (feOwned || beOwned) {
        killProcessIfOwned(ports.FRONTEND_PORT, projectDir);
        killProcessIfOwned(ports.BACKEND_PORT, projectDir);
        return ports;
      }
      continue;
    }
    if (!feUsed && !beUsed) {
      return ports;
    }
    if (!feUsed) killProcessIfOwned(ports.FRONTEND_PORT, projectDir);
    if (!beUsed) killProcessIfOwned(ports.BACKEND_PORT, projectDir);
    return ports;
  }
  return null;
}

function writeEnv(ports) {
  const envPath = path.join(process.cwd(), '.env');
  const projectDir = process.cwd();
  const content = `PROJECT_DIR=${projectDir}
FRONTEND_PORT=${ports.FRONTEND_PORT}
BACKEND_PORT=${ports.BACKEND_PORT}
VITE_API_BASE_URL=http://127.0.0.1:${ports.BACKEND_PORT}
API_BASE_URL=http://127.0.0.1:${ports.BACKEND_PORT}
NODE_ENV=development
JWT_SECRET=jobmatch_secret_key_2024
DATABASE_URL=./data/app.sqlite
`;
  fs.writeFileSync(envPath, content);
  console.log(`Updated .env: FRONTEND_PORT=${ports.FRONTEND_PORT}, BACKEND_PORT=${ports.BACKEND_PORT}`);
}

module.exports = {
  getProjectNumber,
  getTail4,
  getPorts,
  checkPort,
  getPortProcessInfo,
  killProcessIfOwned,
  findAvailablePorts,
  writeEnv
};

if (require.main === module) {
  const command = process.argv[2];
  if (command === 'check') {
    const ports = findAvailablePorts();
    if (!ports) {
      console.error('All port slots are occupied!');
      process.exit(1);
    }
    writeEnv(ports);
  }
}
