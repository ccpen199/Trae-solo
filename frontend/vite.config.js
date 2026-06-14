import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../'));
  const backendPort = parseInt(env.BACKEND_PORT || '58826');
  const apiBaseUrl = env.VITE_API_BASE_URL || env.API_BASE_URL || `http://127.0.0.1:${backendPort}/api`;

  return {
    envDir: path.resolve(__dirname, '../'),
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl)
    },
    server: {
      port: parseInt(env.FRONTEND_PORT || '48826'),
      host: '127.0.0.1',
      strictPort: true
    },
    preview: {
      port: parseInt(env.FRONTEND_PORT || '48826'),
      host: '127.0.0.1',
      strictPort: true
    }
  };
});
