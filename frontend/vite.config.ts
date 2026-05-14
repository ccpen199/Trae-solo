import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default defineConfig({
  plugins: [react()],
  server: {
    port: 12682,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:12681',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:12681',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
