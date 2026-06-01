import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const envPath = path.resolve(__dirname, '..', '.env');
  const env = loadEnv(mode, path.dirname(envPath), '');
  
  const frontendPort = parseInt(env.FRONTEND_PORT) || 44390;
  const backendPort = parseInt(env.BACKEND_PORT) || 54390;

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true
        }
      }
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api'),
      'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(backendPort)
    }
  };
});
