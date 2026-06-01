import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../');
  const FRONTEND_PORT = parseInt(env.FRONTEND_PORT) || 46784;
  const BACKEND_PORT = parseInt(env.BACKEND_PORT) || 56784;

  return {
    plugins: [react()],
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
        },
        '/socket.io': {
          target: `http://127.0.0.1:${BACKEND_PORT}`,
          ws: true,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: FRONTEND_PORT,
      strictPort: true
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || `http://127.0.0.1:${BACKEND_PORT}`)
    }
  };
});
