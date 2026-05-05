import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 22256,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:12256',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:12256',
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
