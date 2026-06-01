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

function killPort(port) {
  try {
    const pid = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null`, { encoding: 'utf8' }).trim();
    if (!pid) {
      console.log(`Port ${port}: No process found`);
      return;
    }
    const cwd = getCwd(pid);
    const cmd = execSync(`ps -o command= -p ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim();
    
    console.log(`Port ${port}: PID=${pid}, CWD=${cwd}`);
    console.log(`Command: ${cmd}`);
    
    if (cwd.startsWith(PROJECT_DIR) || cmd.includes(PROJECT_DIR)) {
      execSync(`kill ${pid} 2>/dev/null`);
      console.log(`✓ Killed process ${pid}`);
    } else {
      console.log(`⚠️  Skipping kill: process does not belong to this project`);
    }
  } catch (e) {
    console.log(`Port ${port}: ${e.message}`);
  }
}

console.log(`Stopping services for project: ${PROJECT_DIR}`);
console.log(`Frontend port: ${FRONTEND_PORT}`);
console.log(`Backend port: ${BACKEND_PORT}`);

killPort(FRONTEND_PORT);
killPort(BACKEND_PORT);

setTimeout(() => {
  console.log('\nChecking if ports are released...');
  try {
    const fePid = execSync(`lsof -nP -iTCP:${FRONTEND_PORT} -sTCP:LISTEN -t 2>/dev/null`, { encoding: 'utf8' }).trim();
    const bePid = execSync(`lsof -nP -iTCP:${BACKEND_PORT} -sTCP:LISTEN -t 2>/dev/null`, { encoding: 'utf8' }).trim();
    if (fePid || bePid) {
      console.log('⚠️  Some ports still occupied. Use force kill if needed.');
    } else {
      console.log('✓ All ports released.');
    }
  } catch {}
}, 1000);
