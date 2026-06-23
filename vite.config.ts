import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@rider': path.resolve(__dirname, './src/apps/rider'),
      '@admin': path.resolve(__dirname, './src/apps/admin'),
      '@mock': path.resolve(__dirname, './src/mock'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
