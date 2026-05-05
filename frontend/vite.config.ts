import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 11224,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:21224',
        changeOrigin: true,
      },
    },
  },
});
