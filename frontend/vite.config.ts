import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const frontendPort = Number(process.env.FRONTEND_PORT || env.FRONTEND_PORT || 49103);
  const backendPort = Number(process.env.BACKEND_PORT || env.BACKEND_PORT || 59103);

  return {
    plugins: [react()],
    optimizeDeps: {
      include: [
        'react',
        'react-dom/client',
        'react-router-dom',
        'axios',
        'lucide-react',
        'react/jsx-dev-runtime',
        'react/jsx-runtime',
      ],
    },
    server: {
      host: '127.0.0.1',
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
