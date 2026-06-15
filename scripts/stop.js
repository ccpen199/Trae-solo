const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectDir = process.cwd();
const envPath = path.join(projectDir, '.env');

function loadEnv() {
  const env = {};
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
  return env;
}

function killProcess(port) {
  try {
    const pid = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t | head -n1`, { encoding: 'utf8' }).trim();
    if (pid) {
      let cwd = '';
      try {
        cwd = execSync(`lsof -p ${pid} | grep cwd | awk '{print $9}'`, { encoding: 'utf8' }).trim();
      } catch (e) {
        cwd = '';
      }
      const cmd = execSync(`ps -p ${pid} -o args=`, { encoding: 'utf8' }).trim();
      const isCurrentProject = cwd.startsWith(projectDir) || cmd.includes(projectDir);
      if (isCurrentProject) {
        execSync(`kill ${pid}`);
        console.log(`Killed process ${pid} on port ${port} (cwd: ${cwd}, cmd: ${cmd})`);
      } else {
        console.log(`Skip kill: cwd=${cwd} cmd=${cmd}`);
      }
    }
  } catch (e) {
    console.log(`No process on port ${port}: ${e.message}`);
  }
}

const env = loadEnv();
killProcess(env.FRONTEND_PORT);
killProcess(env.BACKEND_PORT);
