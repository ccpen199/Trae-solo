import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ mode }) => {
  const envPath = path.resolve(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envMatch = envContent.match(/FRONTEND_PORT=(\d+)/);
  const backendMatch = envContent.match(/BACKEND_PORT=(\d+)/);
  const FRONTEND_PORT = envMatch ? parseInt(envMatch[1]) : 49075;
  const BACKEND_PORT = backendMatch ? parseInt(backendMatch[1]) : 59075;

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: FRONTEND_PORT,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${BACKEND_PORT}`,
          changeOrigin: true,
          secure: false
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: FRONTEND_PORT,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${BACKEND_PORT}`,
          changeOrigin: true,
          secure: false
        }
      }
    },
    define: {
      __FRONTEND_PORT__: JSON.stringify(FRONTEND_PORT),
      __BACKEND_PORT__: JSON.stringify(BACKEND_PORT),
      __API_BASE_URL__: JSON.stringify(`http://127.0.0.1:${BACKEND_PORT}`)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  };
});
