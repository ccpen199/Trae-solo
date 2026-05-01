import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const port = parseInt(process.env.VITE_PORT || '47292', 10);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:47291',
        changeOrigin: true,
      },
      '/track': {
        target: process.env.VITE_API_URL || 'http://localhost:47291',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          utils: ['axios', 'zustand', 'dayjs'],
        },
      },
    },
  },
});
