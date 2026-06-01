const { execFileSync, execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = path.resolve(__dirname);
const serverDir = path.join(projectDir, 'server');
const clientDir = path.join(projectDir, 'client');
const envPath = path.join(projectDir, '.env');

const DEFAULT_FRONTEND_PORT = 43438;
const DEFAULT_BACKEND_PORT = 53438;
const frontendNodeBin = process.execPath;

function nodeCandidates() {
  const candidates = [
    process.env.BACKEND_NODE_BIN,
    process.execPath,
    '/opt/homebrew/bin/node',
  ];
  const nvmDir = path.join(process.env.HOME || '', '.nvm', 'versions', 'node');
  try {
    for (const version of fs.readdirSync(nvmDir)) {
      candidates.push(path.join(nvmDir, version, 'bin', 'node'));
    }
  } catch {
    // nvm is optional on machines that already have a compatible node on PATH.
  }

  return [...new Set(candidates.filter(Boolean))].filter((bin) => {
    try {
      fs.accessSync(bin, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
}

function canLoadBackendSqlite(nodeBin) {
  try {
    execFileSync(
      nodeBin,
      ['-e', "const Database=require('better-sqlite3'); const db=new Database(':memory:'); db.close();"],
      { cwd: serverDir, stdio: 'ignore' }
    );
    return true;
  } catch {
    return false;
  }
}

function resolveBackendNodeBin() {
  const compatible = nodeCandidates().find(canLoadBackendSqlite);
  if (!compatible) return process.execPath;
  if (compatible !== process.execPath) {
    console.log(`Using backend Node binary ${compatible} for installed better-sqlite3 native module`);
  }
  return compatible;
}

function readEnvFile() {
  if (!fs.existsSync(envPath)) return {};
  return fs.readFileSync(envPath, 'utf8').split(/\r?\n/).reduce((env, line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (match) env[match[1]] = match[2];
    return env;
  }, {});
}

function writeEnvFile(values) {
  const keys = Object.keys(values);
  const seen = new Set();
  const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split(/\r?\n/) : [];
  const nextLines = lines
    .filter((line, index) => line !== '' || index < lines.length - 1)
    .map((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=/);
      if (!match || !keys.includes(match[1])) return line;
      seen.add(match[1]);
      return `${match[1]}=${values[match[1]]}`;
    });

  for (const key of keys) {
    if (!seen.has(key)) nextLines.push(`${key}=${values[key]}`);
  }

  fs.writeFileSync(envPath, `${nextLines.join('\n')}\n`);
}

function parsePort(value, fallback) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : fallback;
}

function listeningPids(port) {
  const result = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null || true`).toString().trim();
  return result ? result.split(/\s+/) : [];
}

function pidCwd(pid) {
  try {
    const output = execSync(`lsof -a -p ${pid} -d cwd -Fn 2>/dev/null || true`).toString().split(/\r?\n/);
    const cwd = output.find((line) => line.startsWith('n'));
    return cwd ? cwd.slice(1) : '';
  } catch {
    return '';
  }
}

function isProjectPid(pid) {
  const cwd = pidCwd(pid);
  return cwd === projectDir || cwd.startsWith(`${projectDir}${path.sep}`);
}

function portState(port) {
  const pids = listeningPids(port);
  return {
    pids,
    projectPids: pids.filter(isProjectPid),
    foreignPids: pids.filter((pid) => !isProjectPid(pid)),
  };
}

function resolvePorts() {
  const env = readEnvFile();
  let frontendPort = parsePort(env.FRONTEND_PORT, DEFAULT_FRONTEND_PORT);
  let backendPort = parsePort(env.BACKEND_PORT, DEFAULT_BACKEND_PORT);

  const frontendState = portState(frontendPort);
  const backendState = portState(backendPort);
  if (frontendState.foreignPids.length === 0 && backendState.foreignPids.length === 0) {
    return { env, frontendPort, backendPort };
  }

  for (let offset = 1; offset <= 200; offset += 1) {
    const nextFrontendPort = DEFAULT_FRONTEND_PORT + offset;
    const nextBackendPort = DEFAULT_BACKEND_PORT + offset;
    const nextFrontendState = portState(nextFrontendPort);
    const nextBackendState = portState(nextBackendPort);
    if (nextFrontendState.foreignPids.length === 0 && nextBackendState.foreignPids.length === 0) {
      const nextEnv = {
        ...env,
        FRONTEND_PORT: String(nextFrontendPort),
        BACKEND_PORT: String(nextBackendPort),
      };
      writeEnvFile(nextEnv);
      console.log(`Configured ports were occupied by another project. Updated .env to FRONTEND_PORT=${nextFrontendPort}, BACKEND_PORT=${nextBackendPort}`);
      return { env: nextEnv, frontendPort: nextFrontendPort, backendPort: nextBackendPort };
    }
  }

  throw new Error('No available backup port pair found for this project');
}

const { env, frontendPort, backendPort } = resolvePorts();
const childEnv = {
  ...process.env,
  ...env,
  FRONTEND_PORT: String(frontendPort),
  BACKEND_PORT: String(backendPort),
};

function checkPort(port) {
  return listeningPids(port).join('\n');
}

function startBackend() {
  const state = portState(backendPort);
  if (state.projectPids.length > 0) {
    console.log(`Backend already running on port ${backendPort} (PID: ${state.projectPids.join(', ')})`);
    return;
  }

  const logFile = fs.openSync(path.join(projectDir, 'backend.log'), 'w');
  const child = spawn(resolveBackendNodeBin(), ['server.js'], {
    cwd: serverDir,
    env: childEnv,
    detached: true,
    stdio: ['ignore', logFile, logFile],
  });
  child.unref();
  console.log(`Backend started (PID: ${child.pid}) on http://127.0.0.1:${backendPort}`);
}

function startFrontend() {
  const state = portState(frontendPort);
  if (state.projectPids.length > 0) {
    console.log(`Frontend already running on port ${frontendPort} (PID: ${state.projectPids.join(', ')})`);
    return;
  }

  const logFile = fs.openSync(path.join(projectDir, 'frontend.log'), 'w');
  const viteBin = path.join(clientDir, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(frontendNodeBin, [viteBin, '--host', '127.0.0.1', '--port', String(frontendPort), '--strictPort'], {
    cwd: clientDir,
    env: childEnv,
    detached: true,
    stdio: ['ignore', logFile, logFile],
  });
  child.unref();
  console.log(`Frontend started (PID: ${child.pid}) on http://127.0.0.1:${frontendPort}`);
}

startBackend();
startFrontend();

setTimeout(() => {
  console.log('\n=== Verification ===');
  const bPid = checkPort(backendPort);
  const fPid = checkPort(frontendPort);
  console.log(`Backend port ${backendPort}: ${bPid ? 'LISTENING (PID ' + bPid + ')' : 'NOT LISTENING'}`);
  console.log(`Frontend port ${frontendPort}: ${fPid ? 'LISTENING (PID ' + fPid + ')' : 'NOT LISTENING'}`);
}, 3000);
