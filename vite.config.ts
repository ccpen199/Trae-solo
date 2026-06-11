import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, './shared'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT || '49097'),
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${env.BACKEND_PORT || '59097'}`,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist/frontend',
      sourcemap: true,
    },
  }
})
