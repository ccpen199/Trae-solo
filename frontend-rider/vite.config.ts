import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const backendUrl = env.BACKEND_URL || 'http://127.0.0.1:59312';
  const wsUrl = env.WS_URL || 'ws://127.0.0.1:59313';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: Number(env.FRONTEND_RIDER_PORT) || 49312,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/socket.io': {
          target: wsUrl,
          ws: true,
          changeOrigin: true,
        },
      },
    },
    define: {
      'import.meta.env.VITE_ADMIN_URL': JSON.stringify(env.ADMIN_URL || 'http://127.0.0.1:49313'),
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
