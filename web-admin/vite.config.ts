import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const host = rootEnv.FRONTEND_HOST || rootEnv.HOST || '127.0.0.1';
  const port = Number(rootEnv.FRONTEND_ADMIN_PORT || 50223);
  const backendHost = rootEnv.BACKEND_HOST || rootEnv.HOST || '127.0.0.1';
  const backendPort = Number(rootEnv.BACKEND_PORT || rootEnv.PORT || 59223);

  return {
    envDir: '..',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host,
      port,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://${backendHost}:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  };
})
