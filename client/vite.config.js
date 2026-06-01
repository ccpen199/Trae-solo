import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvDir = path.resolve(__dirname, '..');

function toPort(value, fallback) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : fallback;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootEnvDir, '');
  const frontendPort = toPort(env.FRONTEND_PORT || process.env.FRONTEND_PORT, 43438);
  const backendPort = toPort(env.BACKEND_PORT || process.env.BACKEND_PORT, 53438);

  return {
    envDir: rootEnvDir,
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
