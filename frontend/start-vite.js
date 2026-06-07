import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vite = spawn('node', [
  path.join(__dirname, 'node_modules', '.bin', 'vite'),
  '--host', '127.0.0.1',
  '--port', '49018',
  '--strictPort'
], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, FORCE_COLOR: '1' }
});

vite.stdout.on('data', (data) => process.stdout.write(data));
vite.stderr.on('data', (data) => process.stderr.write(data));

vite.on('exit', (code) => {
  console.log(`Vite exited with code ${code}`);
  process.exit(code);
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
  process.exit(1);
});
