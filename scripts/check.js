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

function checkPort(port, name) {
  try {
    const pid = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t | head -n1`, { encoding: 'utf8' }).trim();
    if (pid) {
      const stat = execSync(`ps -o stat= -p ${pid}`, { encoding: 'utf8' }).trim();
      let cwd = '';
      try {
        cwd = execSync(`lsof -p ${pid} | grep cwd | awk '{print $9}'`, { encoding: 'utf8' }).trim();
      } catch (e) {
        cwd = '';
      }
      const cmd = execSync(`ps -p ${pid} -o args=`, { encoding: 'utf8' }).trim();
      const isCurrentProject = cwd.startsWith(projectDir) || cmd.includes(projectDir);
      if (stat.includes('T') || stat.includes('Z')) {
        console.log(`❌ ${name} port ${port}: PID ${pid} is in bad state (${stat})`);
        return false;
      }
      if (!isCurrentProject) {
        console.log(`⚠️  ${name} port ${port}: PID ${pid} cwd ${cwd} cmd ${cmd} not in project`);
        return false;
      }
      console.log(`✅ ${name} port ${port}: PID ${pid} running (stat: ${stat})`);
      return true;
    }
  } catch (e) {}
  console.log(`❌ ${name} port ${port}: No listener`);
  return false;
}

async function curl(url, name) {
  try {
    const result = execSync(`curl -sS --max-time 5 -o /dev/null -w "%{http_code}" "${url}"`, { encoding: 'utf8' }).trim();
    if (result.startsWith('2') || result.startsWith('3')) {
      console.log(`✅ ${name}: HTTP ${result}`);
      return true;
    }
    console.log(`❌ ${name}: HTTP ${result}`);
    return false;
  } catch (e) {
    console.log(`❌ ${name}: Connection failed`);
    return false;
  }
}

const env = loadEnv();
const feOk = checkPort(env.FRONTEND_PORT, 'Frontend');
const beOk = checkPort(env.BACKEND_PORT, 'Backend');

setTimeout(async () => {
  const feHttp = await curl(`http://127.0.0.1:${env.FRONTEND_PORT}/`, 'Frontend HTTP');
  const beHttp = await curl(`http://127.0.0.1:${env.BACKEND_PORT}/api/health`, 'Backend Health');
  const allOk = feOk && beOk && feHttp && beHttp;
  console.log(allOk ? '\n🎉 All checks passed!' : '\n⚠️  Some checks failed');
  process.exit(allOk ? 0 : 1);
}, 100);
