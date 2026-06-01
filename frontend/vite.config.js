import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const frontendPort = parseInt(env.FRONTEND_PORT) || 44872;
  const backendPort = parseInt(env.BACKEND_PORT) || 54872;
  
  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      strictPort: true,
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
          credentials: true
        }
      }
    }
  };
});
