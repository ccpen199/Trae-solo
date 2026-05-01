import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 9878,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:9876',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'ws://localhost:9876',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
