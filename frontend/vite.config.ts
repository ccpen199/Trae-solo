import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const PORTS = {
  FRONTEND: 9358,
  BACKEND: 8247,
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hospital/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: PORTS.FRONTEND,
    host: true,
    proxy: {
      '/api': {
        target: `http://localhost:${PORTS.BACKEND}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  preview: {
    port: PORTS.FRONTEND,
  },
});
