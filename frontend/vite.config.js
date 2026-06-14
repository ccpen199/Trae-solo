import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#1890ff"/><text x="50" y="68" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="white" text-anchor="middle">蓝</text></svg>`;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const port = parseInt(env.FRONTEND_PORT) || 49034;
  
  return {
    plugins: [
      react(),
      {
        name: 'favicon-fallback',
        configureServer(server) {
          server.middlewares.use('/favicon.ico', (req, res, next) => {
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.end(faviconSvg);
          });
        }
      }
    ],
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${parseInt(env.BACKEND_PORT) || 59034}`,
          changeOrigin: true
        }
      }
    }
  };
});
