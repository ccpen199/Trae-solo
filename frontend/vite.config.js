import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = parseInt(env.FRONTEND_PORT || '49029');
  const backendOrigin = env.VITE_API_ORIGIN || 'http://127.0.0.1:59029';
  
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true
        },
        '/favicon.ico': {
          target: backendOrigin,
          changeOrigin: true
        }
      }
    }
  };
});
