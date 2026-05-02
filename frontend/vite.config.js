import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendPort = 19174;
const frontendPort = 29174;

export default defineConfig({
  plugins: [react()],
  server: {
    port: frontendPort,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
});
