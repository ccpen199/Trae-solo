import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const host = env.VITE_HOST || '127.0.0.1';
  const port = Number(env.VITE_PORT || 5180);
  const apiTarget = env.VITE_API_TARGET || `http://${host}:${env.PORT || 4001}`;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'shared': path.resolve(__dirname, './shared'),
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
  };
});
