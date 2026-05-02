import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 11132,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:11131',
        changeOrigin: true,
      },
    },
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify('http://localhost:11131'),
  },
});
