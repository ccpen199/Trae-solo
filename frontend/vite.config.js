import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const port = parseInt(env.FRONTEND_PORT) || 46880;
  
  return {
    plugins: [react()],
    server: {
      port,
      strictPort: true,
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${parseInt(env.BACKEND_PORT) || 56880}`,
          changeOrigin: true
        },
        '/uploads': {
          target: `http://127.0.0.1:${parseInt(env.BACKEND_PORT) || 56880}`,
          changeOrigin: true
        }
      }
    }
  };
});
