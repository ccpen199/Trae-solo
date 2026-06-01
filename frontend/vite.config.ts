import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 48806,
    strictPort: true,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:58806',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:58806',
        changeOrigin: true,
      },
    },
  },
});
