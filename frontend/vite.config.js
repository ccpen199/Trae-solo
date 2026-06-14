
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const frontendPort = parseInt(env.FRONTEND_PORT) || 48791;
  const backendPort = parseInt(env.BACKEND_PORT) || 58791;

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      host: '127.0.0.1',
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq) => {
              console.log('proxy request:', proxyReq.path);
            });
            proxy.on('proxyRes', (proxyRes) => {
              console.log('proxy response:', proxyRes.statusCode);
            });
          }
        }
      }
    }
  };
});
