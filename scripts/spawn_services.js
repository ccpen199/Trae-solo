const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectDir = path.resolve(__dirname, '..');
const nodeBinDir = '/Users/chen/.nvm/versions/node/v22.22.0/bin';
const target = process.argv[2] || 'all';

const services = {
  backend: {
    port: 59241,
    script: path.join(projectDir, 'scripts', 'run_backend.sh'),
    log: path.join(projectDir, 'backend.log'),
    pid: path.join(projectDir, 'backend.pid'),
  },
  frontend: {
    port: 49242,
    script: path.join(projectDir, 'scripts', 'run_frontend.sh'),
    log: path.join(projectDir, 'frontend.log'),
    pid: path.join(projectDir, 'frontend.pid'),
  },
};

function output(command, args) {
  return execFileSync(command, args, { encoding: 'utf8' }).trim();
}

function isCurrentProjectPid(pid) {
  try {
    const cwd = output('lsof', ['-p', String(pid)])
      .split('\n')
      .find((line) => line.includes(' cwd '))
      ?.trim()
      .split(/\s+/)
      .slice(8)
      .join(' ') || '';
    const command = output('ps', ['-p', String(pid), '-o', 'args=']);
    return cwd.startsWith(projectDir) || command.includes(projectDir);
  } catch {
    return false;
  }
}

function freePort(service) {
  let pids = [];
  try {
    pids = output('lsof', ['-nP', `-iTCP:${service.port}`, '-sTCP:LISTEN', '-t'])
      .split(/\s+/)
      .filter(Boolean);
  } catch {
    return;
  }

  for (const pid of pids) {
    if (!isCurrentProjectPid(pid)) {
      throw new Error(`port ${service.port} is already used by non-project pid ${pid}`);
    }
    try {
      process.kill(Number(pid), 'SIGTERM');
    } catch {}
  }
}

function startService(name) {
  const service = services[name];
  freePort(service);

  const out = fs.openSync(service.log, 'w');
  const err = fs.openSync(service.log, 'a');
  const child = spawn('/bin/zsh', [service.script], {
    cwd: projectDir,
    detached: true,
    env: {
      ...process.env,
      PATH: `${nodeBinDir}:${process.env.PATH || ''}`,
    },
    stdio: ['ignore', out, err],
  });

  fs.writeFileSync(service.pid, `${child.pid}\n`);
  child.unref();
  console.log(`started ${name}: pid=${child.pid} port=${service.port}`);
}

if (!['all', 'backend', 'frontend'].includes(target)) {
  console.error('Usage: node scripts/spawn_services.js [backend|frontend]');
  process.exit(2);
}

if (target === 'all' || target === 'backend') startService('backend');
if (target === 'all' || target === 'frontend') startService('frontend');
