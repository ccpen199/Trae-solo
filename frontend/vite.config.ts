import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'));
  const port = parseInt(env.VITE_FRONTEND_PORT || env.FRONTEND_PORT || '49218');

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: true,
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || env.API_BASE_URL || 'http://127.0.0.1:59218',
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
