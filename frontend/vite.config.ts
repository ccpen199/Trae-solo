import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readRootEnv(): Record<string, string> {
  const envPath = path.resolve(__dirname, '../.env');
  const env: Record<string, string> = {};

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }

  return env;
}

export default defineConfig(() => {
  const rootEnv = readRootEnv();
  const frontendPort = Number.parseInt(rootEnv.FRONTEND_PORT || '43472', 10);
  const backendPort = Number.parseInt(rootEnv.BACKEND_PORT || '53472', 10);

  return {
    plugins: [react()],
    server: {
      host: rootEnv.HOST || '127.0.0.1',
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true
        }
      }
    }
  };
});
