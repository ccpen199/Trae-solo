import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 47841,
    proxy: {
      '/api': {
        target: 'http://localhost:47842',
        changeOrigin: true
      }
    }
  }
});
