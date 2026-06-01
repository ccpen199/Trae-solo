const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.cwd();

function getTail4() {
  const dirName = path.basename(PROJECT_DIR);
  const match = dirName.match(/-(\d+)$/);
  if (!match) throw new Error('Cannot parse project number');
  const numStr = match[1];
  return parseInt(numStr.slice(-4).padStart(4, '0'), 10);
}

function getPorts(slot) {
  const tail4 = getTail4();
  return {
    FRONTEND_PORT: 40000 + slot * 1000 + tail4,
    BACKEND_PORT: 50000 + slot * 1000 + tail4
  };
}

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
    const cwd = execSync(`ps -o cwd= -p ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim();
    const cmd = execSync(`ps -o command= -p ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim();
    return { cwd, cmd };
  } catch {
    return null;
  }
}

function isOwnedByProject(pid) {
  const info = getProcessInfo(pid);
  if (!info) return false;
  return info.cwd.startsWith(PROJECT_DIR) || info.cmd.includes(PROJECT_DIR);
}

function killOwned(pid) {
  if (isOwnedByProject(pid)) {
    try {
      execSync(`kill ${pid} 2>/dev/null`);
      console.log(`Killed owned process ${pid}`);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function writeEnv(ports) {
  const content = `PROJECT_DIR=${PROJECT_DIR}
FRONTEND_PORT=${ports.FRONTEND_PORT}
BACKEND_PORT=${ports.BACKEND_PORT}
VITE_API_BASE_URL=http://127.0.0.1:${ports.BACKEND_PORT}
API_BASE_URL=http://127.0.0.1:${ports.BACKEND_PORT}
NODE_ENV=development
JWT_SECRET=jobmatch_secret_key_2024
DATABASE_URL=./data/app.sqlite
`;
  fs.writeFileSync(path.join(PROJECT_DIR, '.env'), content);
  console.log(`Updated .env: FRONTEND_PORT=${ports.FRONTEND_PORT}, BACKEND_PORT=${ports.BACKEND_PORT}`);
}

console.log(`Project: ${PROJECT_DIR}`);
console.log(`tail4: ${getTail4()}`);

// Find available slot
let selectedPorts = null;
for (let slot = 0; slot <= 5; slot++) {
  const ports = getPorts(slot);
  console.log(`\nChecking slot ${slot}: FE=${ports.FRONTEND_PORT}, BE=${ports.BACKEND_PORT}`);
  
  const fePid = checkPort(ports.FRONTEND_PORT);
  const bePid = checkPort(ports.BACKEND_PORT);
  
  console.log(`  FE port ${ports.FRONTEND_PORT}: ${fePid ? `PID ${fePid}` : 'free'}`);
  console.log(`  BE port ${ports.BACKEND_PORT}: ${bePid ? `PID ${bePid}` : 'free'}`);
  
  if (!fePid && !bePid) {
    selectedPorts = ports;
    console.log(`✅ Slot ${slot} is available!`);
    break;
  }
  
  // Try to kill owned processes
  let canUse = true;
  if (fePid) {
    if (isOwnedByProject(fePid)) {
      killOwned(fePid);
    } else {
      console.log(`⚠️  FE port ${ports.FRONTEND_PORT} used by unowned process ${fePid}, skipping slot`);
      canUse = false;
    }
  }
  if (bePid) {
    if (isOwnedByProject(bePid)) {
      killOwned(bePid);
    } else {
      console.log(`⚠️  BE port ${ports.BACKEND_PORT} used by unowned process ${bePid}, skipping slot`);
      canUse = false;
    }
  }
  
  if (canUse) {
    selectedPorts = ports;
    console.log(`✅ Slot ${slot} is available after cleanup!`);
    break;
  }
}

if (!selectedPorts) {
  console.error('\n❌ All port slots are occupied by other projects!');
  console.error('Please free up some ports or try again later.');
  process.exit(1);
}

// Wait a bit for ports to be released
setTimeout(() => {
  writeEnv(selectedPorts);
  console.log('\n✅ Port configuration updated successfully!');
  console.log(`   Frontend: http://127.0.0.1:${selectedPorts.FRONTEND_PORT}`);
  console.log(`   Backend:  http://127.0.0.1:${selectedPorts.BACKEND_PORT}`);
  process.exit(0);
}, 1500);
