import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const host = env.HOST || '127.0.0.1';
  const frontendPort = Number(env.FRONTEND_PORT || env.APP_PORT || '3000');
  const backendUrl =
    env.BACKEND_URL || `http://${host}:${env.BACKEND_PORT || '59272'}`;

  return {
    plugins: [react()],
    server: {
      host,
      port: frontendPort,
      strictPort: true,
      open: false,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true
        }
      }
    },
    preview: {
      host,
      port: frontendPort,
      strictPort: true
    }
  };
});
