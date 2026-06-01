import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.join(__dirname, '../'), '');
  const port = parseInt(env.FRONTEND_PORT || '43437');
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://127.0.0.1:53437/api';

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiBaseUrl.replace('/api', ''),
          changeOrigin: true
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: port,
      strictPort: true
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
      'import.meta.env.FRONTEND_PORT': JSON.stringify(port)
    }
  };
});
