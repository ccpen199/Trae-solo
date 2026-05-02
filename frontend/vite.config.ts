import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5188,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8432',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5189,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
