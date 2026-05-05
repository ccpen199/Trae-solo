import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    include: '**/*.{js,jsx,ts,tsx}',
  })],
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    port: 30770,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:20770',
        changeOrigin: true
      }
    }
  }
})
