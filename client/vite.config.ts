import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = new URL('.', import.meta.url).pathname;
const srcPath = new URL('./src', import.meta.url).pathname;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '');
  const host = env.VITE_HOST || '127.0.0.1';
  const port = Number(env.VITE_PORT || 5173);
  const apiTarget = env.VITE_API_TARGET || 'http://127.0.0.1:59300';
  const wsTarget = env.VITE_WS_TARGET || 'ws://127.0.0.1:59301';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': srcPath,
      },
    },
    server: {
      port,
      host,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: wsTarget,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
