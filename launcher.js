const { spawn } = require('child_process');
const path = require('path');

const PROJECT_DIR = __dirname;
const FRONTEND_PORT = 48918;
const BACKEND_PORT = 58918;

console.log('=== 临床用药路径管理系统启动 ===');
console.log(`前端端口: ${FRONTEND_PORT}`);
console.log(`后端端口: ${BACKEND_PORT}`);
console.log('');

const backend = spawn('node', ['server.js'], {
  cwd: path.join(PROJECT_DIR, 'backend'),
  stdio: 'ignore',
  detached: true
});
backend.unref();
console.log(`后端启动中... PID: ${backend.pid}`);

setTimeout(() => {
  const frontend = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--strictPort'], {
    cwd: path.join(PROJECT_DIR, 'frontend'),
    stdio: 'ignore',
    detached: true
  });
  frontend.unref();
  console.log(`前端启动中... PID: ${frontend.pid}`);
  
  setTimeout(() => {
    console.log('');
    console.log('=== 启动完成 ===');
    console.log(`前端地址: http://127.0.0.1:${FRONTEND_PORT}/`);
    console.log(`后端 API: http://127.0.0.1:${BACKEND_PORT}/api`);
    console.log('');
    console.log('日志文件:');
    console.log('  - backend.log');
    console.log('  - frontend.log');
    process.exit(0);
  }, 12000);
}, 5000);
