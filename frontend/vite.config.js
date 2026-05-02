import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 29171,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:19171',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 29171
  }
});
