import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  port: 9166,
  server: {
    port: 9166,
    proxy: {
      '/api': {
        target: 'http://localhost:9165',
        changeOrigin: true,
      },
      '/gateway': {
        target: 'http://localhost:9165',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
