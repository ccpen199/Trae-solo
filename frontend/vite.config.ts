import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const host = env.VITE_HOST || env.HOST || '127.0.0.1';
  const port = Number(env.VITE_PORT || env.FRONTEND_PORT || 5173);
  const apiTarget = env.VITE_API_TARGET || `http://${env.BACKEND_HOST || host}:${env.BACKEND_PORT || env.PORT || 3002}`;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host,
      port,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host,
      port,
      strictPort: true,
    },
  };
});
