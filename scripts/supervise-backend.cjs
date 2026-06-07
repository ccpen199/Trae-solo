const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backendDir = path.join(root, 'backend');
const logPath = path.join(root, 'backend.log');
const pidPath = path.join(root, 'backend.pid');
const nodeBin = process.execPath;
const env = {
  ...process.env,
  BACKEND_PORT: '59020',
  PORT: '59020',
  HOST: '127.0.0.1',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

fs.writeFileSync(path.join(root, 'backend-supervisor.pid'), String(process.pid));

let child = null;
let stopping = false;

function append(line) {
  fs.appendFileSync(logPath, `${new Date().toISOString()} ${line}\n`);
}

function start() {
  if (stopping) return;
  const out = fs.openSync(logPath, 'a');
  child = spawn(nodeBin, ['src/index.js'], {
    cwd: backendDir,
    env,
    stdio: ['ignore', out, out],
  });
  fs.closeSync(out);
  fs.writeFileSync(pidPath, String(child.pid));
  append(`[supervisor] backend child started pid=${child.pid}`);
  child.on('exit', (code, signal) => {
    append(`[supervisor] backend child exited code=${code ?? ''} signal=${signal ?? ''}`);
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
