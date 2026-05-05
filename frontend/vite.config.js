import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 22102,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:22101',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:22101',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
