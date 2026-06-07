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
    exec(`ps -o stat=,command= -p ${pid} && lsof -a -p ${pid} -d cwd -Fn 2>/dev/null`, (error, stdout) => {
      if (error) {
        resolve(null);
      } else {
        const lines = stdout.trim().split('\n');
        const cwd = lines.find(line => line.startsWith('n'))?.slice(1) || '';
        const parts = (lines[0] || '').trim().split(/\s+/);
        resolve({
          stat: parts[0],
          cwd,
          command: parts.slice(1).join(' ')
        });
      }
    });
  });
}

function checkHttp(url) {
  return new Promise((resolve) => {
    exec(`curl -I --max-time 5 ${url} 2>/dev/null | head -n1`, (error, stdout) => {
      if (error) {
        resolve({ success: false, status: '连接失败' });
      } else {
        const match = stdout.trim().match(/HTTP\/\d+\.?\d* (\d+)/);
        if (match) {
          resolve({ success: true, status: match[1] });
        } else {
          resolve({ success: false, status: stdout.trim() || '无响应' });
        }
      }
    });
  });
}

async function checkService(name, port, url) {
  console.log(`\n[${name}]`);
  console.log(`  端口: ${port}`);

  const pid = await checkPort(port);
  if (!pid) {
    console.log('  状态: ❌ 未监听');
    return false;
  }

  console.log(`  PID: ${pid}`);

  const info = await getProcessInfo(pid);
  if (!info) {
    console.log('  状态: ❌ 进程不存在');
    return false;
  }

  console.log(`  状态码: ${info.stat}`);
  console.log(`  工作目录: ${info.cwd}`);
  console.log(`  命令: ${info.command.substring(0, 60)}...`);

  if (info.stat.includes('T')) {
    console.log('  状态: ❌ 已停止');
    return false;
  }
  if (info.stat.includes('Z')) {
    console.log('  状态: ❌ 僵尸进程');
    return false;
  }

  if (!info.cwd.startsWith(PROJECT_ROOT)) {
    console.log('  归属: ⚠️  不属于当前项目');
  } else {
    console.log('  归属: ✅ 属于当前项目');
  }

  const http = await checkHttp(url);
  if (http.success) {
    console.log(`  HTTP: ✅ ${http.status}`);
    return true;
  } else {
    console.log(`  HTTP: ❌ ${http.status}`);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('  服务状态检查');
  console.log('========================================');
  console.log(`项目目录: ${PROJECT_ROOT}`);

  const backendOk = await checkService(
    '后端服务',
    BACKEND_PORT,
    `http://127.0.0.1:${BACKEND_PORT}/api/health`
  );

  const frontendOk = await checkService(
    '前端服务',
    FRONTEND_PORT,
    `http://127.0.0.1:${FRONTEND_PORT}/`
  );

  console.log('\n========================================');
  console.log('  总结');
  console.log('========================================');
  console.log(`后端服务: ${backendOk ? '✅ 正常' : '❌ 异常'}`);
  console.log(`前端服务: ${frontendOk ? '✅ 正常' : '❌ 异常'}`);

  if (backendOk && frontendOk) {
    console.log('\n🎉 所有服务运行正常！');
    console.log(`\n访问地址: http://127.0.0.1:${FRONTEND_PORT}`);
    process.exit(0);
  } else {
    console.log('\n⚠️  部分服务异常，请检查日志');
    process.exit(1);
  }
}

main().catch(console.error);
