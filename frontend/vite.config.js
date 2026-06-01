import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 43454,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:53454',
        changeOrigin: true
      }
    }
  }
});
