import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '43415', 10);

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: FRONTEND_PORT,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.BACKEND_PORT || 53415}`,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
});
