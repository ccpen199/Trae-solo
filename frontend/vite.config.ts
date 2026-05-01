import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 28763,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:18763',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:18763',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
