import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const FRONTEND_PORT = Number(env.FRONTEND_PORT) || 41266;
  const BACKEND_PORT = Number(env.BACKEND_PORT) || 51266;
  
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: FRONTEND_PORT,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${BACKEND_PORT}`,
          changeOrigin: true
        }
      }
    }
  };
});
