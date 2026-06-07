const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = fs.openSync(path.join(__dirname, 'backend.log'), 'w');

const proc = spawn('node', ['src/server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: ['ignore', logFile, logFile],
  detached: true
});

proc.unref();
console.log('Backend started with PID:', proc.pid);
process.exit(0);
