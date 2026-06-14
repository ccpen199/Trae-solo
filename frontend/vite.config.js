import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT) || 49024,
      strictPort: true,
      hmr: {
        host: '127.0.0.1',
        port: parseInt(env.FRONTEND_PORT) || 49024
      },
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${parseInt(env.BACKEND_PORT) || 59024}`,
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || `http://127.0.0.1:${parseInt(env.BACKEND_PORT) || 59024}/api`),
      'import.meta.env.VITE_FRONTEND_PORT': JSON.stringify(parseInt(env.FRONTEND_PORT) || 49024),
      'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(parseInt(env.BACKEND_PORT) || 59024)
    }
  };
});
