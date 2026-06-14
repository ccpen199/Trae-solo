import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd() + '/..', '');
  
  return {
    plugins: [react()],
    envDir: '..',
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT) || 49084,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.BACKEND_URL || 'http://127.0.0.1:59084',
          changeOrigin: true,
          secure: false
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT) || 49084,
      strictPort: true
    }
  };
});
