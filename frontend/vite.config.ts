import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../'), '');
  const port = parseInt(env.FRONTEND_PORT || '49219');
  const backendUrl = env.BACKEND_URL || 'http://127.0.0.1:59219';
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      host: '127.0.0.1',
      port,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port,
      strictPort: true
    }
  };
});
