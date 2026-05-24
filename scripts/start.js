const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = path.resolve(__dirname, '..');
const frontendDir = path.join(projectDir, 'frontend');
const backendDir = path.join(projectDir, 'backend');

const startProcess = (cwd, cmd, args, logFile) => {
  const out = fs.openSync(logFile, 'w');
  const child = spawn(cmd, args, {
    cwd,
    stdio: ['ignore', out, out],
    detached: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });
  child.unref();
  fs.closeSync(out);
  return child.pid;
};

console.log('Starting services...');
console.log(`Project: ${projectDir}`);
console.log('');

const backendPid = startProcess(
  backendDir,
  'node',
  ['src/server.js'],
  path.join(backendDir, 'backend.log')
);
console.log(`✓ Backend started, PID: ${backendPid}`);
console.log(`  Log: ${backendDir}/backend.log`);

setTimeout(() => {
  const viteBin = path.join(frontendDir, 'node_modules', '.bin', 'vite');
  const frontendPid = startProcess(
    frontendDir,
    'node',
    [viteBin, '--host', '127.0.0.1', '--strictPort'],
    path.join(frontendDir, 'frontend.log')
  );
  console.log(`✓ Frontend started, PID: ${frontendPid}`);
  console.log(`  Log: ${frontendDir}/frontend.log`);
  console.log('');
  console.log('Wait 5 seconds for services to initialize...');
  console.log('');

  setTimeout(() => {
    const { execSync } = require('child_process');
    console.log('=== Service Status ===');
    try {
      const be = execSync('lsof -nP -iTCP:53669 -sTCP:LISTEN 2>/dev/null | grep LISTEN', { encoding: 'utf8' }).trim();
      console.log('✓ Backend (53669): LISTENING');
    } catch {
      console.log('✗ Backend (53669): NOT LISTENING');
    }
    try {
      const fe = execSync('lsof -nP -iTCP:43669 -sTCP:LISTEN 2>/dev/null | grep LISTEN', { encoding: 'utf8' }).trim();
      console.log('✓ Frontend (43669): LISTENING');
    } catch {
      console.log('✗ Frontend (43669): NOT LISTENING');
    }
    console.log('');
    console.log('=== Access URLs ===');
    console.log('Frontend: http://127.0.0.1:43669');
    console.log('Backend:  http://127.0.0.1:53669');
    console.log('Health:   http://127.0.0.1:53669/api/health');
  }, 5000);
}, 1500);
