const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const frontendDir = path.join(root, 'frontend');
const logPath = path.join(root, 'frontend.log');
const pidPath = path.join(root, 'frontend.pid');
const nodeBin = process.execPath;
const viteBin = path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');
const env = {
  ...process.env,
  FRONTEND_PORT: '50034',
  BACKEND_PORT: '59034',
  VITE_API_BASE_URL: 'http://127.0.0.1:59034/api',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

fs.writeFileSync(path.join(root, 'frontend-supervisor.pid'), String(process.pid));

let child = null;
let stopping = false;

function append(line) {
  fs.appendFileSync(logPath, `${new Date().toISOString()} ${line}\n`);
}

function start() {
  if (stopping) return;
  const out = fs.openSync(logPath, 'a');
  child = spawn(nodeBin, [viteBin, '--host', '127.0.0.1', '--port', '50034', '--strictPort'], {
    cwd: frontendDir,
    env,
    stdio: ['pipe', out, out],
  });
  child.stdin.on('error', () => {});
  fs.closeSync(out);
  fs.writeFileSync(pidPath, String(child.pid));
  append(`[supervisor] frontend child started pid=${child.pid}`);
  child.on('exit', (code, signal) => {
    append(`[supervisor] frontend child exited code=${code ?? ''} signal=${signal ?? ''}`);
    child = null;
    if (!stopping) setTimeout(start, 1500);
  });
}

function stop() {
  stopping = true;
  if (child && !child.killed) child.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGTERM', stop);
process.on('SIGINT', stop);
start();
