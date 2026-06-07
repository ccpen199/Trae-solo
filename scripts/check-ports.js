const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectDir = process.cwd();
const envPath = path.join(projectDir, '.env');

function parseEnv() {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });
  return env;
}

function writeEnv(env) {
  const lines = Object.entries(env).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(envPath, lines.join('\n') + '\n');
}

function isPortOccupied(port) {
  try {
    const result = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null | head -n1`, { encoding: 'utf8' });
    return result.trim() !== '';
  } catch {
    return false;
  }
}

function getPortOwner(port) {
  try {
    const pid = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null | head -n1`, { encoding: 'utf8' }).trim();
    if (!pid) return null;
    const cwd = execSync(`ps -o cwd= -p ${pid} 2>/dev/null | xargs`, { encoding: 'utf8' }).trim();
    const cmd = execSync(`ps -o command= -p ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim();
    return { pid, cwd, cmd };
  } catch {
    return null;
  }
}

function isOurProcess(owner) {
  if (!owner) return false;
  return owner.cwd.startsWith(projectDir);
}

function killOurProcess(port) {
  const owner = getPortOwner(port);
  if (owner && isOurProcess(owner)) {
    try {
      execSync(`kill ${owner.pid} 2>/dev/null`);
      console.log(`Killed our process on port ${port} (PID: ${owner.pid})`);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

const tail4 = '9007';
const slots = [
  { f: 40000, b: 50000 },
  { f: 41000, b: 51000 },
  { f: 42000, b: 52000 },
  { f: 43000, b: 53000 },
  { f: 44000, b: 54000 },
  { f: 45000, b: 55000 },
];

let env = parseEnv();
let foundSlot = null;

for (const slot of slots) {
  const frontendPort = slot.f + parseInt(tail4);
  const backendPort = slot.b + parseInt(tail4);
  
  const feOccupied = isPortOccupied(frontendPort);
  const beOccupied = isPortOccupied(backendPort);
  
  if (!feOccupied && !beOccupied) {
    foundSlot = { frontendPort, backendPort };
    break;
  }
  
  if (feOccupied) {
    const feOwner = getPortOwner(frontendPort);
    if (isOurProcess(feOwner)) {
      killOurProcess(frontendPort);
      if (!isPortOccupied(frontendPort) && !isPortOccupied(backendPort)) {
        foundSlot = { frontendPort, backendPort };
        break;
      }
    }
  }
  
  if (beOccupied) {
    const beOwner = getPortOwner(backendPort);
    if (isOurProcess(beOwner)) {
      killOurProcess(backendPort);
      if (!isPortOccupied(frontendPort) && !isPortOccupied(backendPort)) {
        foundSlot = { frontendPort, backendPort };
        break;
      }
    }
  }
}

if (!foundSlot) {
  console.error('ERROR: All port slots are occupied by other projects!');
  for (const slot of slots) {
    const frontendPort = slot.f + parseInt(tail4);
    const backendPort = slot.b + parseInt(tail4);
    const feOwner = getPortOwner(frontendPort);
    const beOwner = getPortOwner(backendPort);
    if (feOwner) console.error(`  Port ${frontendPort}: PID ${feOwner.pid}, cwd=${feOwner.cwd}`);
    if (beOwner) console.error(`  Port ${backendPort}: PID ${beOwner.pid}, cwd=${beOwner.cwd}`);
  }
  process.exit(1);
}

env.FRONTEND_PORT = foundSlot.frontendPort.toString();
env.BACKEND_PORT = foundSlot.backendPort.toString();
env.VITE_API_BASE_URL = `http://127.0.0.1:${foundSlot.backendPort}`;
writeEnv(env);

console.log(`Using ports: FRONTEND=${foundSlot.frontendPort}, BACKEND=${foundSlot.backendPort}`);
module.exports = { frontendPort: foundSlot.frontendPort, backendPort: foundSlot.backendPort };
