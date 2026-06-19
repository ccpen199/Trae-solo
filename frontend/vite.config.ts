import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(configDir, '..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '');
  const frontendHost = env.FRONTEND_HOST || process.env.FRONTEND_HOST || '127.0.0.1';
  const frontendPort = Number(env.FRONTEND_PORT || process.env.FRONTEND_PORT || 49245);
  const backendHost = env.BACKEND_HOST || process.env.BACKEND_HOST || '127.0.0.1';
  const backendPort = Number(env.BACKEND_PORT || process.env.BACKEND_PORT || 59245);
  const backendTarget =
    env.BACKEND_URL || process.env.BACKEND_URL || `http://${backendHost}:${backendPort}`;

  return {
    plugins: [react()],
    server: {
      host: frontendHost,
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/socket.io': {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
