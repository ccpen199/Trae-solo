import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../'), '');
  
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT || '49067'),
      strictPort: true,
      proxy: {
        '/api': {
          target: env.BACKEND_TARGET || 'http://127.0.0.1:59067',
          changeOrigin: true,
          secure: false
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT || '49067'),
      strictPort: true
    }
  };
});
