import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const host = env.HOST || '127.0.0.1';
  const frontendPort = Number(env.FRONTEND_PORT || 49169);
  const backendPort = env.BACKEND_PORT || '59169';

  return {
    plugins: [react()],
    server: {
      host,
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true
        }
      }
    }
  };
});
