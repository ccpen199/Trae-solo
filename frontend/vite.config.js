import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 47662,
    proxy: {
      '/api': {
        target: 'http://localhost:47661',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:47661',
        changeOrigin: true
      }
    }
  }
});
