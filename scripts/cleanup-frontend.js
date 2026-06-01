const { execSync } = require('child_process');
const path = require('path');

function loadEnv() {
  const fs = require('fs');
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
const PROJECT_DIR = process.cwd();

function checkPort(port) {
  try {
    const pid = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null`, { encoding: 'utf8' }).trim();
    return pid || null;
  } catch {
    return null;
  }
}

function getProcessCwd(pid) {
  try {
    const result = execSync(`ps -p ${pid} -o cwd= 2>/dev/null`, { encoding: 'utf8' }).trim();
    return result;
  } catch {
    return null;
  }
}

function killOwnedProcesses(port) {
  const pid = checkPort(port);
  if (!pid) {
    console.log(`Port ${port} is free`);
    return true;
  }

  const cwd = getProcessCwd(pid);
  console.log(`Port ${port} is used by PID ${pid}, CWD: ${cwd}`);

  if (cwd && (cwd.startsWith(PROJECT_DIR) || cwd.startsWith(PROJECT_DIR.replace('/local_projects/', '/'))) ) {
    console.log(`Killing owned process ${pid}...`);
    try {
      execSync(`kill ${pid} 2>/dev/null`);
      return true;
    } catch (e) {
      console.log(`Failed to kill: ${e.message}`);
      return false;
    }
  } else {
    console.log(`Process ${pid} is not owned by this project, will not kill.`);
    return false;
  }
}

function killAllViteInProject() {
  try {
    const pids = execSync(`pgrep -f "vite" 2>/dev/null`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    console.log(`Found ${pids.length} vite processes`);
    
    pids.forEach(pid => {
      const cwd = getProcessCwd(pid);
      if (cwd && (cwd.startsWith(PROJECT_DIR) || cwd.startsWith(PROJECT_DIR.replace('/local_projects/', '/')))) {
        console.log(`Killing vite process ${pid} (cwd: ${cwd})`);
        try {
          execSync(`kill ${pid} 2>/dev/null`);
        } catch (e) {
          console.log(`Failed to kill ${pid}`);
        }
      }
    });
  } catch (e) {
    console.log('No vite processes found');
  }
}

console.log(`Cleaning up port ${FRONTEND_PORT}...`);
killOwnedProcesses(FRONTEND_PORT);
killAllViteInProject();

setTimeout(() => {
  const pid = checkPort(FRONTEND_PORT);
  if (pid) {
    console.log(`Port ${FRONTEND_PORT} still occupied by ${pid}`);
  } else {
    console.log(`Port ${FRONTEND_PORT} is now free`);
  }
  process.exit(0);
}, 2000);
