import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 48202,
    proxy: {
      '/api': {
        target: 'http://localhost:48201',
        changeOrigin: true
      }
    }
  }
});
