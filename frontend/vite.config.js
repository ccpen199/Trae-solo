import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const port = process.env.VITE_PORT || 7013
const proxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:7012'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: port,
    host: true,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: proxyTarget.replace('http', 'ws'),
        ws: true
      }
    }
  }
})
