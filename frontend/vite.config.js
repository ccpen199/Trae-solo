import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

function readRootEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  const env = {};
  if (!fs.existsSync(envPath)) {
    return env;
  }

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (match) {
      env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

export default defineConfig(() => {
  const env = readRootEnv();
  const frontendPort = Number(env.FRONTEND_PORT || 46782);
  const backendPort = Number(env.BACKEND_PORT || 56782);

  return {
    server: {
      host: '127.0.0.1',
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true
        }
      }
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || '')
    }
  };
});
