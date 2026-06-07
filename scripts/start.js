const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FRONTEND_PORT = process.env.FRONTEND_PORT || 49027;
const BACKEND_PORT = process.env.BACKEND_PORT || 59027;
const NODE_22 = '/Users/chen/.nvm/versions/node/v22.22.0/bin/node';
const NODE_BIN = fs.existsSync(NODE_22) ? NODE_22 : process.execPath;

function checkPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, (error, stdout) => {
      if (stdout.trim()) {
        resolve(stdout.trim().split('\n')[0]);
      } else {
        resolve(null);
      }
    });
  });
}

function checkProcessOwner(pid) {
  return new Promise((resolve) => {
    exec(`lsof -a -p ${pid} -d cwd -Fn 2>/dev/null`, (error, stdout) => {
      if (error) {
        resolve(false);
        return;
      }
      const cwd = stdout.split('\n').find(line => line.startsWith('n'))?.slice(1) || '';
      resolve(cwd.startsWith(PROJECT_ROOT));
    });
  });
}

async function killProcessIfOwned(port) {
  const pid = await checkPort(port);
  if (pid) {
    const isOwned = await checkProcessOwner(pid);
    if (isOwned) {
      console.log(`正在终止端口 ${port} 上的进程 (PID: ${pid})...`);
      exec(`kill ${pid}`);
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.log(`端口 ${port} 被其他项目占用，无法终止`);
      return false;
    }
  }
  return true;
}

function startBackend() {
  console.log('启动后端服务...');
  const backendLogPath = path.join(__dirname, '..', 'backend.log');
  const logFd = fs.openSync(backendLogPath, 'a');
  const backend = spawn(NODE_BIN, ['src/index.js'], {
    cwd: path.join(__dirname, '..', 'backend'),
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: {
      ...process.env,
      FRONTEND_PORT: String(FRONTEND_PORT),
      BACKEND_PORT: String(BACKEND_PORT),
      VITE_API_BASE_URL: `http://127.0.0.1:${BACKEND_PORT}/api`
    }
  });
  backend.unref();
  return backend.pid;
}

function startFrontend() {
  console.log('启动前端服务...');
  const frontendLogPath = path.join(__dirname, '..', 'frontend.log');
  const viteBin = path.join(__dirname, '..', 'frontend', 'node_modules', 'vite', 'bin', 'vite.js');
  const logFd = fs.openSync(frontendLogPath, 'a');
  const frontend = spawn(NODE_BIN, [viteBin, '--host', '127.0.0.1', '--port', String(FRONTEND_PORT), '--strictPort'], {
    cwd: path.join(__dirname, '..', 'frontend'),
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: {
      ...process.env,
      FRONTEND_PORT: String(FRONTEND_PORT),
      BACKEND_PORT: String(BACKEND_PORT),
      VITE_API_BASE_URL: `http://127.0.0.1:${BACKEND_PORT}/api`
    }
  });
  frontend.unref();
  return frontend.pid;
}

async function main() {
  console.log('========================================');
  console.log('  省级"一网通办"数字政务中枢系统 - 启动脚本');
  console.log('========================================');
  console.log(`前端端口: ${FRONTEND_PORT}`);
  console.log(`后端端口: ${BACKEND_PORT}`);
  console.log('');

  const backendOk = await killProcessIfOwned(BACKEND_PORT);
  const frontendOk = await killProcessIfOwned(FRONTEND_PORT);

  if (!backendOk || !frontendOk) {
    console.error('\n端口被占用且无法释放，请手动处理或更换端口');
    process.exit(1);
  }

  const backendPid = startBackend();
  console.log(`后端服务启动中，PID: ${backendPid}`);

  await new Promise(r => setTimeout(r, 3000));

  const frontendPid = startFrontend();
  console.log(`前端服务启动中，PID: ${frontendPid}`);

  console.log('\n等待服务完全启动...');
  await new Promise(r => setTimeout(r, 8000));

  console.log('\n========================================');
  console.log('  服务启动完成！');
  console.log('========================================');
  console.log(`前端地址: http://127.0.0.1:${FRONTEND_PORT}`);
  console.log(`后端地址: http://127.0.0.1:${BACKEND_PORT}`);
  console.log('');
  console.log('测试账号:');
  console.log('  管理员: admin / 123456');
  console.log('  企业用户: enterprise1 / 123456');
  console.log('  个人用户: citizen1 / 123456');
  console.log('');
  console.log('日志文件:');
  console.log('  后端: backend.log');
  console.log('  前端: frontend.log');
  console.log('');
  console.log('停止服务: npm run stop');
  console.log('检查状态: npm run check');
  console.log('========================================');
}

main().catch(console.error);
