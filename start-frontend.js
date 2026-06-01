import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = fs.openSync(path.join(__dirname, 'frontend.log'), 'a');

const p = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '46778', '--strictPort'], {
  cwd: path.join(__dirname, 'frontend'),
  detached: true,
  stdio: ['ignore', logFile, logFile]
});

p.unref();
console.log(p.pid);
