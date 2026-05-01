import { defineConfig, ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const backendPort = parseInt(process.env.BACKEND_PORT || '19876')
const frontendPort = parseInt(process.env.FRONTEND_PORT || '19877')

const apiProxy: Record<string, ProxyOptions> = {
  '/api': {
    target: `http://localhost:${backendPort}`,
    changeOrigin: true,
    secure: false,
    logLevel: 'info',
    configure: (proxy) => {
      proxy.on('error', (err, req, res) => {
        console.log('[代理错误] 无法连接到后端服务:', err.message)
        if (!res.headersSent) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            success: false,
            message: '后端服务暂时不可用，请确保后端服务已启动',
            data: null,
            code: 503
          }))
        }
      })
    }
  },
  '/health': {
    target: `http://localhost:${backendPort}`,
    changeOrigin: true,
    secure: false,
  }
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: frontendPort,
    host: '0.0.0.0',
    strictPort: false,
    open: false,
    hmr: {
      overlay: true,
    },
    proxy: apiProxy,
    watch: {
      usePolling: false,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
    minify: 'esbuild',
  },
  css: {
    devSourcemap: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'antd',
      'axios',
      'zustand',
      'dayjs',
      '@ant-design/icons',
    ],
  },
})
