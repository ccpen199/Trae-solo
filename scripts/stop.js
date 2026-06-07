const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

const FRONTEND_PORT = process.env.FRONTEND_PORT || 49027;
const BACKEND_PORT = process.env.BACKEND_PORT || 59027;
const PROJECT_ROOT = path.resolve(__dirname, '..');

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

function getProcessInfo(pid) {
  return new Promise((resolve) => {
    exec(`ps -o command= -p ${pid} && lsof -a -p ${pid} -d cwd -Fn 2>/dev/null`, (error, stdout) => {
      if (error) {
        resolve(null);
      } else {
        const lines = stdout.trim().split('\n');
        const cwd = lines.find(line => line.startsWith('n'))?.slice(1) || '';
        resolve({
          cwd,
          command: lines[0] || ''
        });
      }
    });
  });
}

async function killProcessIfOwned(port, name) {
  const pid = await checkPort(port);
  if (!pid) {
    console.log(`${name} (端口 ${port}): 未运行`);
    return;
  }

  const info = await getProcessInfo(pid);
  if (!info) {
    console.log(`${name} (端口 ${port}, PID ${pid}): 无法获取进程信息，跳过`);
    return;
  }

  if (info.cwd.startsWith(PROJECT_ROOT)) {
    console.log(`${name} (端口 ${port}, PID ${pid}): 正在终止...`);
    exec(`kill ${pid}`);
    await new Promise(r => setTimeout(r, 1000));
    console.log(`${name} (端口 ${port}, PID ${pid}): 已终止`);
  } else {
    console.log(`${name} (端口 ${port}, PID ${pid}): 不属于当前项目，跳过`);
    console.log(`  cwd: ${info.cwd}`);
  }
}

async function main() {
  console.log('========================================');
  console.log('  停止服务');
  console.log('========================================');
  console.log(`项目目录: ${PROJECT_ROOT}`);
  console.log('');

  await killProcessIfOwned(BACKEND_PORT, '后端服务');
  await killProcessIfOwned(FRONTEND_PORT, '前端服务');

  console.log('\n========================================');
  console.log('  操作完成');
  console.log('========================================');
}

main().catch(console.error);
