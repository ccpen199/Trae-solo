const net = require('net');
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '8765');
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '5173');
const PROJECT_ROOT = path.resolve(__dirname, '..');

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

function getProcessInfo(port) {
  try {
    const cmd = `lsof -i :${port} -F pcn 2>/dev/null | head -3`;
    const result = execSync(cmd, { encoding: 'utf8' });
    const lines = result.trim().split('\n');
    let pid = null, cmdName = null, cwd = null;
    
    lines.forEach(line => {
      if (line.startsWith('p')) pid = line.substring(1);
      if (line.startsWith('c')) cmdName = line.substring(1);
      if (line.startsWith('n')) cwd = line.substring(1);
    });
    
    if (pid) {
      try {
        const cwdCmd = `lsof -p ${pid} | grep cwd | awk '{print $9}' 2>/dev/null`;
        cwd = execSync(cwdCmd, { encoding: 'utf8' }).trim();
      } catch (e) {}
    }
    
    return { pid, cmdName, cwd };
  } catch (e) {
    return null;
  }
}

function isProjectProcess(processInfo) {
  if (!processInfo || !processInfo.cwd) return false;
  const normalizedCwd = path.resolve(processInfo.cwd);
  return normalizedCwd.startsWith(PROJECT_ROOT);
}

async function killProcessIfOwned(port, processInfo) {
  if (!processInfo || !processInfo.pid) return false;
  
  if (isProjectProcess(processInfo)) {
    console.log(`端口 ${port} 被当前项目进程占用 (PID: ${processInfo.pid})，正在终止...`);
    try {
      execSync(`kill ${processInfo.pid} 2>/dev/null`);
      await new Promise(r => setTimeout(r, 1000));
      const stillInUse = await isPortInUse(port);
      if (!stillInUse) {
        console.log(`端口 ${port} 已释放`);
        return true;
      }
    } catch (e) {}
  }
  return false;
}

async function checkPort(port, name) {
  const inUse = await isPortInUse(port);
  if (!inUse) {
    console.log(`✓ ${name} 端口 ${port} 可用`);
    return true;
  }
  
  const processInfo = getProcessInfo(port);
  console.log(`⚠ ${name} 端口 ${port} 已被占用`);
  if (processInfo) {
    console.log(`  - PID: ${processInfo.pid}`);
    console.log(`  - 命令: ${processInfo.cmdName}`);
    console.log(`  - 目录: ${processInfo.cwd || '未知'}`);
    console.log(`  - 是否当前项目: ${isProjectProcess(processInfo) ? '是' : '否'}`);
  }
  
  if (processInfo && isProjectProcess(processInfo)) {
    const killed = await killProcessIfOwned(port, processInfo);
    if (killed) return true;
  }
  
  return false;
}

async function main() {
  console.log('=== 端口占用检查 ===');
  console.log(`项目根目录: ${PROJECT_ROOT}\n`);
  
  const backendOk = await checkPort(BACKEND_PORT, '后端');
  console.log('');
  const frontendOk = await checkPort(FRONTEND_PORT, '前端');
  
  console.log('\n=== 检查结果 ===');
  if (backendOk && frontendOk) {
    console.log('✓ 所有端口可用，可以启动服务');
    process.exit(0);
  } else {
    if (!backendOk) console.log(`✗ 后端端口 ${BACKEND_PORT} 被非当前项目进程占用，请手动处理或更换端口`);
    if (!frontendOk) console.log(`✗ 前端端口 ${FRONTEND_PORT} 被非当前项目进程占用，请手动处理或更换端口`);
    console.log('\n提示: 如需更换端口，请修改项目根目录的 .env 文件');
    process.exit(1);
  }
}

main().catch(console.error);
