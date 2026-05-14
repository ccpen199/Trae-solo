import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 47552,
    proxy: {
      '/api': {
        target: 'http://localhost:47551',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:47551',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 47552
  }
});
