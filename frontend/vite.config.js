import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 48853,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:58853',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://127.0.0.1:58853',
        changeOrigin: true
      }
    }
  }
});
