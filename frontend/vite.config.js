import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '..');
  const env = { ...loadEnv(mode, envDir, ''), ...process.env };
  const frontendPort = Number(env.FRONTEND_PORT || 49048);
  const backendPort = Number(env.BACKEND_PORT || 59048);

  return {
    envDir,
    plugins: [react()],
    server: {
      port: frontendPort,
      strictPort: true,
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api'),
    },
  };
});
