import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 31085,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:11085',
        changeOrigin: true,
      },
    },
  },
});
