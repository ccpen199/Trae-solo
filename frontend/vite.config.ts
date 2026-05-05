import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 22631,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:12263',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:12263',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 22631,
  },
});
