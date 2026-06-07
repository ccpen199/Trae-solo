const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = fs.openSync(path.join(__dirname, 'frontend.log'), 'w');

const proc = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: ['ignore', logFile, logFile],
  detached: true
});

proc.unref();
console.log('Frontend started with PID:', proc.pid);
process.exit(0);
