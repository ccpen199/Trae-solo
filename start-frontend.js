const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'frontend.log');
const logFd = fs.openSync(logPath, 'w');

const child = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '46777', '--strictPort'], {
  cwd: path.join(__dirname, 'frontend'),
  detached: true,
  stdio: ['ignore', logFd, logFd]
});

child.unref();
console.log('Frontend server started with PID:', child.pid);
process.exit(0);
