import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const port = parseInt(env.FRONTEND_PORT) || 48939;

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${parseInt(env.BACKEND_PORT) || 58939}`,
          changeOrigin: true
        },
        '/uploads': {
          target: `http://127.0.0.1:${parseInt(env.BACKEND_PORT) || 58939}`,
          changeOrigin: true
        }
      }
    }
  };
});
