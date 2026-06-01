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

const BACKEND_PORT = process.env.BACKEND_PORT || 56784;

const logPath = path.join(__dirname, '../backend.log');
const backendDir = path.join(__dirname, '../backend');
const logFd = fs.openSync(logPath, 'a');

const backend = spawn(process.execPath, ['src/app.js'], {
  cwd: backendDir,
  detached: true,
  stdio: ['ignore', logFd, logFd],
});

backend.unref();

console.log(`Backend started with PID: ${backend.pid}`);
console.log(`Log: ${logPath}`);
console.log(`Port: ${BACKEND_PORT}`);

setTimeout(() => {
  console.log('Exiting starter script...');
  process.exit(0);
}, 3000);
