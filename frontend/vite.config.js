import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 21813,
    proxy: {
      '/api': {
        target: 'http://localhost:11813',
        changeOrigin: true
      }
    }
  }
});
