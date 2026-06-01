const { execSync } = require('child_process');

function loadEnv() {
  const fs = require('fs');
  const path = require('path');
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

const FRONTEND_PORT = process.env.FRONTEND_PORT || 46784;
const BACKEND_PORT = process.env.BACKEND_PORT || 56784;
const PROJECT_DIR = process.cwd();

function checkPort(port) {
  try {
    const pid = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null`, { encoding: 'utf8' }).trim();
    return pid || null;
  } catch {
    return null;
  }
}

function getProcessInfo(pid) {
  try {
    const info = execSync(`ps -p ${pid} -o pid=,ppid=,stat=,cwd=,command= 2>/dev/null`, { encoding: 'utf8' }).trim();
    const stat = execSync(`ps -o stat= -p ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim();
    return { info, stat };
  } catch {
    return null;
  }
}

function curl(url, isHead = false) {
  try {
    const cmd = isHead 
      ? `curl -I --max-time 5 ${url} 2>&1 | head -5`
      : `curl -sS --max-time 5 ${url} 2>&1`;
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (e) {
    return e.message;
  }
}

console.log('========================================');
console.log('  Service Verification');
console.log('========================================');
console.log(`Project: ${PROJECT_DIR}`);
console.log(`Frontend Port: ${FRONTEND_PORT}`);
console.log(`Backend Port: ${BACKEND_PORT}`);

console.log('\n=== Checking Frontend ===');
const fePid = checkPort(FRONTEND_PORT);
console.log(`Frontend PID: ${fePid || 'NOT FOUND'}`);

let frontendOk = false;
if (fePid) {
  const feInfo = getProcessInfo(fePid);
  console.log(feInfo?.info);
  console.log(`Status: ${feInfo?.stat}`);
  
  if (feInfo?.stat?.includes('T') || feInfo?.stat?.includes('Z')) {
    console.log(`❌ Frontend process is in bad state: ${feInfo.stat}`);
  } else {
    const feHttp = curl(`http://127.0.0.1:${FRONTEND_PORT}/`, true);
    console.log('\nFrontend HTTP:');
    console.log(feHttp);
    
    if (feHttp.includes('200') || feHttp.includes('301') || feHttp.includes('302')) {
      frontendOk = true;
      console.log('✅ Frontend: HEALTHY');
    } else {
      console.log('❌ Frontend: HTTP check failed');
    }
  }
} else {
  console.log('❌ Frontend is not listening');
}

console.log('\n=== Checking Backend ===');
const bePid = checkPort(BACKEND_PORT);
console.log(`Backend PID: ${bePid || 'NOT FOUND'}`);

let backendOk = false;
if (bePid) {
  const beInfo = getProcessInfo(bePid);
  console.log(beInfo?.info);
  console.log(`Status: ${beInfo?.stat}`);
  
  if (beInfo?.stat?.includes('T') || beInfo?.stat?.includes('Z')) {
    console.log(`❌ Backend process is in bad state: ${beInfo.stat}`);
  } else {
    const beHealth = curl(`http://127.0.0.1:${BACKEND_PORT}/api/health`);
    console.log('\nBackend Health API:');
    console.log(beHealth);
    
    const beJobs = curl(`http://127.0.0.1:${BACKEND_PORT}/api/jobs/list/all?limit=2`);
    console.log('\nBackend Jobs API (first 200 chars):');
    console.log(beJobs.substring(0, 200));
    
    if (beHealth.includes('ok')) {
      backendOk = true;
      console.log('\n✅ Backend: HEALTHY');
    } else {
      console.log('\n❌ Backend: Health check failed');
    }
  }
} else {
  console.log('❌ Backend is not listening');
}

console.log('\n========================================');
console.log('  Summary');
console.log('========================================');

if (frontendOk && backendOk) {
  console.log('\n🎉 All services are running properly!');
  console.log(`\n🌐 Frontend: http://127.0.0.1:${FRONTEND_PORT}`);
  console.log(`🔧 Backend:  http://127.0.0.1:${BACKEND_PORT}`);
  console.log('\n📋 Test Accounts:');
  console.log('   Admin:    admin / 123456');
  console.log('   HR:       hr_tech / 123456');
  console.log('   Jobseeker: zhangsan / 123456');
  process.exit(0);
} else {
  console.log('\n❌ Some services are unhealthy, please check logs.');
  console.log('\nFrontend log: tail -50 frontend.log');
  console.log('Backend log:  tail -50 backend.log');
  process.exit(1);
}
