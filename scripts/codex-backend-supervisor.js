const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const backendDir = path.join(projectRoot, 'backend');
const logPath = path.join(projectRoot, 'backend.log');
const preferredNode = '/Users/chen/.nvm/versions/node/v22.22.0/bin/node';
const nodeBin = fs.existsSync(preferredNode) ? preferredNode : process.execPath;

let child = null;
let stopping = false;

function log(line) {
  fs.appendFileSync(logPath, `${new Date().toISOString()} ${line}\n`);
}

function start() {
  log(`[codex-supervisor] starting backend with ${nodeBin}`);
  const logFd = fs.openSync(logPath, 'a');
  child = spawn(nodeBin, ['src/index.js'], {
    cwd: backendDir,
    env: { ...process.env },
    stdio: ['ignore', logFd, logFd]
  });

  child.on('exit', (code, signal) => {
    fs.closeSync(logFd);
    log(`[codex-supervisor] backend exited code=${code} signal=${signal || ''}`);
    child = null;
    if (!stopping) {
      setTimeout(start, 2000);
    }
  });
}

function stop(signal) {
  stopping = true;
  log(`[codex-supervisor] received ${signal}, stopping`);
  if (child) {
    child.kill(signal);
  }
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGTERM', () => stop('SIGTERM'));
process.on('SIGINT', () => stop('SIGINT'));

start();
setInterval(() => {}, 60_000);
