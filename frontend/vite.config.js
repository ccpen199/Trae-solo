import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 46383,
    host: '127.0.0.1',
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:56383',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 46383,
    host: '127.0.0.1',
    strictPort: true
  }
});
