#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const projectDir = __dirname;
const preferredNodeBin = path.join(process.env.HOME || '', '.nvm/versions/node/v22.22.0/bin/node');
const nodeBin = fs.existsSync(preferredNodeBin) ? preferredNodeBin : process.execPath;
const nodeBinDir = path.dirname(nodeBin);

function loadEnv() {
  const envPath = path.join(projectDir, '.env');
  const env = { ...process.env, PATH: `${nodeBinDir}:${process.env.PATH || ''}` };
  if (!fs.existsSync(envPath)) return env;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }
  return env;
}

function start(name, command, args, cwd, logFile, pidFile) {
  const out = fs.openSync(logFile, 'w');
  const child = spawn(command, args, {
    cwd,
    env: loadEnv(),
    detached: true,
    stdio: ['ignore', out, out],
  });
  fs.writeFileSync(pidFile, `${child.pid}\n`);
  child.unref();
  console.log(`${name} started PID=${child.pid}`);
}

const service = process.argv[2];
if (service === 'backend') {
  start(
    'Backend',
    nodeBin,
    ['src/server.js'],
    path.join(projectDir, 'backend'),
    path.join(projectDir, 'backend.log'),
    path.join(projectDir, 'backend.pid'),
  );
} else if (service === 'frontend') {
  const env = loadEnv();
  start(
    'Frontend',
    nodeBin,
    [
      path.join(projectDir, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      env.FRONTEND_PORT || '49083',
      '--strictPort',
    ],
    path.join(projectDir, 'frontend'),
    path.join(projectDir, 'frontend.log'),
    path.join(projectDir, 'frontend.pid'),
  );
} else {
  console.error('Usage: node start_detached.js <backend|frontend>');
  process.exit(1);
}
