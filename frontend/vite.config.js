import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '..', '.env');
let FRONTEND_PORT = 43431;
let BACKEND_PORT = 53431;
try {
  const envContent = readFileSync(envPath, 'utf-8');
  const fm = envContent.match(/FRONTEND_PORT=(\d+)/);
  const bm = envContent.match(/BACKEND_PORT=(\d+)/);
  if (fm) FRONTEND_PORT = parseInt(fm[1], 10);
  if (bm) BACKEND_PORT = parseInt(bm[1], 10);
} catch (e) {}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: FRONTEND_PORT,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${BACKEND_PORT}`,
        changeOrigin: true,
      },
    },
  },
});
