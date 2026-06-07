import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  envDir: '..',
  server: {
    port: 48935,
    strictPort: true,
    host: '127.0.0.1',
    hmr: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:58935',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 48935,
    strictPort: true,
    host: '127.0.0.1'
  }
})
