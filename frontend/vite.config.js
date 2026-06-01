import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../')
  const port = parseInt(env.FRONTEND_PORT || 48858)
  
  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || 'http://127.0.0.1:58858/api')
    }
  }
})
