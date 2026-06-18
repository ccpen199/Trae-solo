import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd() + '/..', '');
  const port = parseInt(env.FRONTEND_PORT || '49231', 10);
  const apiUrl = env.VITE_API_URL || `http://127.0.0.1:${parseInt(env.BACKEND_PORT || '59231', 10)}/api`;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '127.0.0.1',
      port,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${parseInt(env.BACKEND_PORT || '59231', 10)}`,
          changeOrigin: true,
        },
      },
    },
    define: {
      'import.meta.env.VITE_API_PORT': JSON.stringify(port),
    },
  };
});
