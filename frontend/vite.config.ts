import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const host = env.HOST || '127.0.0.1';
  const port = Number(env.FRONTEND_PORT || 49309);
  const backendUrl = env.BACKEND_URL || 'http://127.0.0.1:59309';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      host,
      port,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true
        },
        '/uploads': {
          target: backendUrl,
          changeOrigin: true
        }
      }
    }
  };
});
