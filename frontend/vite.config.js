import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const port = parseInt(env.FRONTEND_PORT || '49291', 10);
  const backendPort = parseInt(env.BACKEND_PORT || '59291', 10);

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
          ws: true
        },
        '/ws': {
          target: `ws://127.0.0.1:${backendPort}`,
          ws: true,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: port,
      strictPort: true
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || `http://127.0.0.1:${backendPort}/api`),
      'import.meta.env.VITE_WS_URL': JSON.stringify(`ws://127.0.0.1:${backendPort}/ws`)
    }
  };
});
