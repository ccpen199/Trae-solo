import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 21771,
    proxy: {
      '/api': {
        target: 'http://localhost:22177',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 21771
  }
});
