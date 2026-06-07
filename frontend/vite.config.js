import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'));
  const port = parseInt(env.VITE_FRONTEND_PORT || env.FRONTEND_PORT || '49061', 10);
  const backendPort = parseInt(env.VITE_BACKEND_PORT || env.BACKEND_PORT || '59061', 10);

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port,
      strictPort: true
    },
    envDir: path.resolve(__dirname, '..'),
    define: {
      __APP_VERSION__: JSON.stringify('1.0.0')
    }
  };
});
