import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../'), '');
  const port = parseInt(env.FRONTEND_PORT) || 49104;
  const apiBaseUrl = env.VITE_API_URL || env.API_BASE_URL || 'http://127.0.0.1:59104/api';

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiBaseUrl.replace('/api', ''),
          changeOrigin: true,
          secure: false
        },
        '/uploads': {
          target: apiBaseUrl.replace('/api', ''),
          changeOrigin: true,
          secure: false
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiBaseUrl),
      'import.meta.env.VITE_FRONTEND_URL': JSON.stringify(env.FRONTEND_URL || `http://127.0.0.1:${port}`),
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(env.BACKEND_URL || 'http://127.0.0.1:59104')
    }
  };
});
