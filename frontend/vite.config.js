import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 44867,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:54867',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 44867,
    host: true,
    strictPort: true
  }
});
