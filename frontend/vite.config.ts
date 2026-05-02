import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 11691,
    proxy: {
      '/api': {
        target: 'http://localhost:11169',
        changeOrigin: true,
      },
    },
  },
});
