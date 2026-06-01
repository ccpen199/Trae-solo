import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const tail4 = parseInt(env.TAIL4 || '6787');
  const portSlot = parseInt(env.PORT_SLOT || '0');
  const frontendPort = parseInt(env.FRONTEND_PORT || `${40000 + portSlot * 1000 + tail4}`);
  const backendPort = parseInt(env.BACKEND_PORT || `${50000 + portSlot * 1000 + tail4}`);
  const apiBaseUrl = env.VITE_API_BASE_URL || `http://127.0.0.1:${backendPort}/api`;

  return {
    plugins: [react()],
    envDir: '..',
    server: {
      host: '127.0.0.1',
      port: frontendPort,
      strictPort: true,
      hmr: {
        host: '127.0.0.1',
        port: frontendPort
      },
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
          secure: false
        }
      }
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
      'process.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl)
    }
  };
});
