import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT) || 43363;

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: FRONTEND_PORT,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${parseInt(process.env.BACKEND_PORT) || 53363}`,
        changeOrigin: true
      }
    }
  },
  define: {
    'process.env': process.env
  }
});
