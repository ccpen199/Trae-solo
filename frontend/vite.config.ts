import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT || '49168', 10),
      strictPort: true,
      proxy: {
        '/api': { target: env.BACKEND_URL || 'http://127.0.0.1:59168', changeOrigin: true },
        '/uploads': { target: env.BACKEND_URL || 'http://127.0.0.1:59168', changeOrigin: true },
        '/socket.io': { target: env.BACKEND_URL || 'http://127.0.0.1:59168', changeOrigin: true, ws: true }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT || '49168', 10),
      strictPort: true
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') }
    }
  };
});
