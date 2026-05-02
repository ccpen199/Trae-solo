import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [VantResolver()],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [VantResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: parseInt(process.env.CUSTOMER_PORT || '3803'),
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.APP_URL || 'http://localhost:3800',
        changeOrigin: true,
      },
      '/ws': {
        target: process.env.APP_URL || 'http://localhost:3800',
        ws: true,
      },
    },
  },
})
