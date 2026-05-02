import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // 端口配置入口: 本地直跑端口，默认值 14000
    // Docker映射端口: 14000:8082 (外部:内部)
    // 避坑提示: 不使用 4000, 8080 等常见端口
    port: 14000,
    proxy: {
      '/api': {
        // 代理目标: 后端 API 端口
        target: 'http://localhost:18888',
        changeOrigin: true
      }
    }
  }
})