import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
  ],
  server: {
    port: 45854,
    proxy: {
      '/api': {
        target: 'http://localhost:44854',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
