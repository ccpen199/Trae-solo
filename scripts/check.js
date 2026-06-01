const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}
loadEnv();

const FRONTEND_PORT = process.env.FRONTEND_PORT;
const BACKEND_PORT = process.env.BACKEND_PORT;
const PROJECT_DIR = path.resolve(__dirname, '..');

function getCwd(pid) {
  return execSync(`lsof -nP -p ${pid} 2>/dev/null | awk '$4=="cwd"{print $9; exit}'`, { encoding: 'utf8' }).trim();
}

function checkService(port, name) {
  console.log(`\n=== Checking ${name} (port ${port}) ===`);
  
  try {
    const pid = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null`, { encoding: 'utf8' }).trim();
    if (!pid) {
      console.log(`❌ ${name} is NOT running`);
      return false;
    }
    console.log(`✓ PID: ${pid}`);
    
    const stat = execSync(`ps -o stat= -p ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim();
    console.log(`✓ Status: ${stat}`);
    
    if (stat === 'T' || stat === 'Z') {
      console.log(`❌ Process is in bad state: ${stat}`);
      return false;
    }
    
    const cwd = getCwd(pid);
    const cmd = execSync(`ps -o command= -p ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim();
    console.log(`✓ CWD: ${cwd}`);
    console.log(`✓ Command: ${cmd}`);
    
    if (!cwd.startsWith(PROJECT_DIR) && !cmd.includes(PROJECT_DIR)) {
      console.log(`⚠️  CWD does not belong to this project!`);
    }
    
    return true;
  } catch (e) {
    console.log(`❌ Error checking ${name}:`, e.message);
    return false;
  }
}

function curlCheck(port, path, name) {
  console.log(`\n=== HTTP Check: ${name} ===`);
  try {
    const result = execSync(`curl -I --max-time 5 http://127.0.0.1:${port}${path} 2>/dev/null`, { encoding: 'utf8' });
    const firstLine = result.split('\n')[0];
    console.log(`✓ ${firstLine.trim()}`);
    return firstLine.includes('200') || firstLine.includes('301') || firstLine.includes('302');
  } catch (e) {
    console.log(`❌ HTTP check failed`);
    return false;
  }
}

async function main() {
  console.log(`Project Directory: ${PROJECT_DIR}`);
  console.log(`Frontend Port: ${FRONTEND_PORT}`);
  console.log(`Backend Port: ${BACKEND_PORT}`);
  
  const feRunning = checkService(FRONTEND_PORT, 'Frontend');
  const beRunning = checkService(BACKEND_PORT, 'Backend');
  
  const feHttp = feRunning && curlCheck(FRONTEND_PORT, '/', 'Frontend Home');
  const beHttp = beRunning && curlCheck(BACKEND_PORT, '/api/health', 'Backend Health');
  
  console.log('\n=== Summary ===');
  console.log(`Frontend: ${feRunning && feHttp ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  console.log(`Backend:  ${beRunning && beHttp ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  
  if (feRunning && feHttp && beRunning && beHttp) {
    console.log('\n🎉 All services are running properly!');
    console.log(`Frontend: http://127.0.0.1:${FRONTEND_PORT}`);
    console.log(`Backend: http://127.0.0.1:${BACKEND_PORT}`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch(console.error);
