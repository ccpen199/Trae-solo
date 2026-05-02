import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 21301,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:12130',
        changeOrigin: true,
      },
    },
  },
});
