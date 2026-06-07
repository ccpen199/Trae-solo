import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../');
  const rootEnv = loadEnv(mode, process.cwd());
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: parseInt(rootEnv.VITE_FRONTEND_PORT || env.VITE_FRONTEND_PORT || env.FRONTEND_PORT || '49035'),
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${env.VITE_BACKEND_PORT || env.BACKEND_PORT || '59035'}`,
          changeOrigin: true
        }
      }
    }
  };
});
