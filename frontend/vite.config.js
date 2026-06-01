import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = parseInt(env.FRONTEND_PORT) || 44865;
  const backendPort = parseInt(env.BACKEND_PORT) || 54865;
  
  return {
    plugins: [react()],
    server: {
      port: port,
      host: '127.0.0.1',
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true
        }
      }
    }
  };
});
