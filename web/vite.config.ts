import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function readProjectEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eq = trimmed.indexOf('=');
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const projectEnv = readProjectEnv();
const frontendHost = process.env.FRONTEND_HOST || projectEnv.FRONTEND_HOST || projectEnv.HOST || '127.0.0.1';
const frontendPort = Number(process.env.FRONTEND_PORT || projectEnv.FRONTEND_PORT || 49240);
const backendTarget = process.env.VITE_API_TARGET || projectEnv.VITE_API_TARGET || `http://${projectEnv.BACKEND_HOST || projectEnv.HOST || '127.0.0.1'}:${projectEnv.BACKEND_PORT || 59240}`;

export default defineConfig({
  plugins: [react()],
  server: {
    host: frontendHost,
    port: frontendPort,
    strictPort: true,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true
      },
      '/socket.io': {
        target: backendTarget,
        changeOrigin: true,
        ws: true
      }
    }
  }
});
