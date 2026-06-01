import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT || '43391'),
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${env.BACKEND_PORT || '53391'}`,
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
