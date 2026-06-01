const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}
loadEnv();

const FRONTEND_PORT = process.env.FRONTEND_PORT || 46784;

const logPath = path.join(__dirname, '../frontend.log');
const frontendDir = path.join(__dirname, '../frontend');
const viteBin = path.join(frontendDir, 'node_modules/vite/bin/vite.js');
const logFd = fs.openSync(logPath, 'a');

const vite = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--strictPort', '--port', String(FRONTEND_PORT)], {
  cwd: frontendDir,
  detached: true,
  stdio: ['ignore', logFd, logFd],
});

vite.unref();

console.log(`Frontend started with PID: ${vite.pid}`);
console.log(`Log: ${logPath}`);
console.log(`Port: ${FRONTEND_PORT}`);

setTimeout(() => {
  console.log('Exiting starter script...');
  process.exit(0);
}, 3000);
