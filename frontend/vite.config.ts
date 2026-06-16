import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const frontendHost = env.FRONTEND_HOST || env.HOST || '127.0.0.1';
  const backendHost = env.BACKEND_HOST || env.HOST || '127.0.0.1';
  const frontendPort = Number(env.FRONTEND_PORT || 49220);
  const backendPort = Number(env.BACKEND_PORT || 59220);
  const backendTarget = `http://${backendHost}:${backendPort}`;

  return {
    plugins: [react()],
    server: {
      host: frontendHost,
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/socket.io': {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
