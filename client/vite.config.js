import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 22501,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:12250',
        changeOrigin: true
      },
      '/videos': {
        target: 'http://localhost:12250',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:12250',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
