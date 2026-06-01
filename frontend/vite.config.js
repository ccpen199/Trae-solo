import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: parseInt(process.env.FRONTEND_PORT || 48909),
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.BACKEND_PORT || 58909}`,
        changeOrigin: true
      }
    }
  }
});
