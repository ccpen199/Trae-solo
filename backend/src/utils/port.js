const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getPortStatus(port) {
  try {
    const output = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, { encoding: 'utf8' });
    const pids = output.trim().split('\n').filter(Boolean);
    if (pids.length > 0) {
      const pid = pids[0];
      const cwd = execSync(`ps -o cwd= -p ${pid}`, { encoding: 'utf8' }).trim();
      const cmd = execSync(`ps -o command= -p ${pid}`, { encoding: 'utf8' }).trim();
      return { occupied: true, pid, cwd, cmd };
    }
    return { occupied: false };
  } catch (e) {
    return { occupied: false };
  }
}

function isCurrentProject(cwd, projectDir) {
  return cwd.startsWith(projectDir);
}

function updateEnvFile(frontendPort, backendPort) {
  const envPath = path.join(__dirname, '..', '..', '..', '.env');
  let content = fs.readFileSync(envPath, 'utf8');
  content = content.replace(/FRONTEND_PORT=\d+/, `FRONTEND_PORT=${frontendPort}`);
  content = content.replace(/BACKEND_PORT=\d+/, `BACKEND_PORT=${backendPort}`);
  content = content.replace(/API_BASE_URL=http:\/\/127\.0\.0\.1:\d+/, `API_BASE_URL=http://127.0.0.1:${backendPort}`);
  fs.writeFileSync(envPath, content);
  
  process.env.FRONTEND_PORT = frontendPort;
  process.env.BACKEND_PORT = backendPort;
  process.env.API_BASE_URL = `http://127.0.0.1:${backendPort}`;
}

function checkAndAllocatePorts(projectDir) {
  const envPath = path.join(__dirname, '..', '..', '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const tail4Match = envContent.match(/FRONTEND_PORT=4(\d{4})/);
  let tail4 = '9075';
  if (tail4Match) {
    tail4 = tail4Match[1];
  }
  
  const slots = [0, 1000, 2000, 3000, 4000, 5000];
  
  for (const slot of slots) {
    const frontendPort = 40000 + slot + parseInt(tail4);
    const backendPort = 50000 + slot + parseInt(tail4);
    
    const feStatus = getPortStatus(frontendPort);
    const beStatus = getPortStatus(backendPort);
    
    if (!feStatus.occupied && !beStatus.occupied) {
      if (slot > 0) {
        updateEnvFile(frontendPort, backendPort);
        console.log(`使用备用槽位 ${slot}: FRONTEND_PORT=${frontendPort}, BACKEND_PORT=${backendPort}`);
      }
      return { frontendPort, backendPort };
    }
    
    if (feStatus.occupied && isCurrentProject(feStatus.cwd, projectDir)) {
      console.log(`端口 ${frontendPort} 被当前项目占用，PID: ${feStatus.pid}`);
      try {
        process.kill(parseInt(feStatus.pid), 'SIGTERM');
        console.log(`已终止进程 ${feStatus.pid}`);
      } catch (e) {
        console.log(`终止进程失败: ${e.message}`);
      }
    }
    
    if (beStatus.occupied && isCurrentProject(beStatus.cwd, projectDir)) {
      console.log(`端口 ${backendPort} 被当前项目占用，PID: ${beStatus.pid}`);
      try {
        process.kill(parseInt(beStatus.pid), 'SIGTERM');
        console.log(`已终止进程 ${beStatus.pid}`);
      } catch (e) {
        console.log(`终止进程失败: ${e.message}`);
      }
    }
  }
  
  console.error('所有端口槽位均被占用，无法启动服务');
  process.exit(1);
}

module.exports = { getPortStatus, isCurrentProject, checkAndAllocatePorts };
