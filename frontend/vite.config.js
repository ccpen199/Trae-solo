import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  return {
    plugins: [react()],
    server: {
      port: parseInt(env.FRONTEND_PORT || 43423),
      strictPort: true,
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${env.BACKEND_PORT || 53423}`,
          changeOrigin: true
        }
      }
    },
    preview: {
      port: parseInt(env.FRONTEND_PORT || 43423),
      strictPort: true,
      host: '127.0.0.1'
    }
  };
});
