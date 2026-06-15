#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const adminRoot = path.join(projectRoot, 'admin');
const envPath = path.join(projectRoot, '.env');

function loadEnv(filePath) {
  const values = {};
  if (!fs.existsSync(filePath)) return values;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    values[key] = value;
  }
  return values;
}

const fileEnv = loadEnv(envPath);
const frontendPort = fileEnv.FRONTEND_PORT || '50213';
const backendPort = fileEnv.BACKEND_PORT || fileEnv.PORT || '60213';
const baseEnv = {
  ...process.env,
  ...fileEnv,
  NODE_ENV: fileEnv.NODE_ENV || 'development',
  LOCAL_SMOKE_MODE: fileEnv.LOCAL_SMOKE_MODE || 'true',
  PORT: backendPort,
  PATH: [
    path.dirname(process.execPath),
    '/usr/local/bin',
    '/opt/homebrew/bin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
  ].join(':'),
};

function startDetached(name, cwd, args, logFile, pidFile) {
  const logPath = path.join(projectRoot, logFile);
  const pidPath = path.join(projectRoot, pidFile);
  const out = fs.openSync(logPath, 'w');
  const err = fs.openSync(logPath, 'a');
  const child = spawn(process.execPath, args, {
    cwd,
    env: baseEnv,
    detached: true,
    stdio: ['ignore', out, err],
  });

  child.unref();
  fs.closeSync(out);
  fs.closeSync(err);
  fs.writeFileSync(pidPath, `${child.pid}\n`);
  console.log(`${name} pid=${child.pid}`);
}

startDetached(
  'backend',
  projectRoot,
  ['dist/src/main.js'],
  'backend.log',
  'backend.pid'
);

startDetached(
  'frontend',
  adminRoot,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    frontendPort,
    '--strictPort',
  ],
  'frontend.log',
  'frontend.pid'
);
