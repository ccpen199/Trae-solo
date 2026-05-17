import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 47752,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:47751',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  css: {
    preprocessorOptions: {
      css: {
        modules: {
          localsConvention: 'camelCase'
        }
      }
    }
  }
});
