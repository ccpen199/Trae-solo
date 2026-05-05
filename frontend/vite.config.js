import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 22218,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:12218',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
});
