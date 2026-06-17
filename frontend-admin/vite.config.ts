import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const host = process.env.FRONTEND_HOST || process.env.HOST || '127.0.0.1';
const port = Number(process.env.FRONTEND_ADMIN_PORT || 50212);
const backendHost = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1';
const backendPort = Number(process.env.BACKEND_PORT || process.env.PORT || 59212);

export default defineConfig({
  envDir: '..',
  plugins: [react()],
  server: {
    host,
    port,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://${backendHost}:${backendPort}`,
        changeOrigin: true
      }
    }
  }
});
