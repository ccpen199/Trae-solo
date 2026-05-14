import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9811,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:9810',
        changeOrigin: true
      }
    }
  }
});