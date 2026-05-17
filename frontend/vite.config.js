import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.join(__dirname, '../'), '');
  return {
    plugins: [react()],
    server: {
      port: parseInt(env.FRONTEND_PORT) || 47741,
      proxy: {
        '/api': {
          target: `http://localhost:${env.BACKEND_PORT || 47742}`,
          changeOrigin: true
        }
      }
    }
  };
});
