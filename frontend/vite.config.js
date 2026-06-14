import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const PROJECT_DIR = path.resolve(__dirname, '..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, PROJECT_DIR, '');
  const FRONTEND_PORT = parseInt(env.FRONTEND_PORT || '49070');
  const BACKEND_PORT = parseInt(env.BACKEND_PORT || '59070');

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: FRONTEND_PORT,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${BACKEND_PORT}`,
          changeOrigin: true,
          secure: false
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: FRONTEND_PORT,
      strictPort: true
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api')
    }
  };
});
