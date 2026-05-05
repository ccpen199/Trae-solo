import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 22281,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:12228',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 22281
  }
});
