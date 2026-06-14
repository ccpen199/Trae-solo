import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import path from 'path'
import { theme } from 'antd'

const { defaultAlgorithm, darkAlgorithm } = theme

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          '@primary-color': '#165DFF',
          '@border-radius-base': '6px',
          '@font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif'
        }
      }
    }
  },
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/charts'],
          echarts: ['echarts', 'echarts-for-react'],
          utils: ['dayjs', 'axios', 'crypto-js']
        }
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 49106,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:59106',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths()
  ],
})
