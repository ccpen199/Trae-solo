import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const port = parseInt(env.FRONTEND_PORT || '49068');
  const apiBaseUrl = env.API_BASE_URL || 'http://127.0.0.1:59068/api';
  const backendPort = parseInt(env.BACKEND_PORT || '59068');

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
        },
      },
    },
    define: {
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
      __FRONTEND_PORT__: port,
      __BACKEND_PORT__: backendPort,
    },
  };
});
