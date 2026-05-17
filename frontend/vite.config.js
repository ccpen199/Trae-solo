import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 47732,
    proxy: {
      '/api': {
        target: 'http://localhost:47731',
        changeOrigin: true
      }
    }
  }
});
