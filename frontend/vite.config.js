import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 21098,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:11098',
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: 'http://localhost:11098',
        changeOrigin: true
      }
    }
  },
  root: '.',
  publicDir: 'public'
});
