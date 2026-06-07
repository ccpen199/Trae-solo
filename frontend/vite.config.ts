import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const FRONTEND_PORT = parseInt(env.FRONTEND_PORT || '49066', 10);
  const BACKEND_PORT = parseInt(env.BACKEND_PORT || '59066', 10);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      host: '127.0.0.1',
      port: FRONTEND_PORT,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${BACKEND_PORT}`,
          changeOrigin: true
        },
        '/uploads': {
          target: `http://127.0.0.1:${BACKEND_PORT}`,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: FRONTEND_PORT,
      strictPort: true
    }
  };
});
