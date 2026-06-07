import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 49010,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:59010',
        changeOrigin: true
      }
    }
  }
});
