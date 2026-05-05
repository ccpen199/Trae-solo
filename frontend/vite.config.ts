import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 21223,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:12239',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 21223,
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});