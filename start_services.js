const { spawn } = require('child_process');
const path = require('path');

console.log('启动后端服务...');
const backend = spawn('node', ['src/index.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  detached: true
});

backend.unref();

setTimeout(() => {
  console.log('\n启动前端服务...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    detached: true
  });
  frontend.unref();
}, 3000);
