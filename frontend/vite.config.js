import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 12672,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:12671',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 12672
  }
});
