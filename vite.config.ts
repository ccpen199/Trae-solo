import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

export default defineConfig(() => {
  const host = process.env.SERVER_HOST || '127.0.0.1';
  const serverPort = parseInt(process.env.SERVER_PORT || '59276', 10);
  const adminPort = parseInt(process.env.ADMIN_PORT || '49276', 10);

  return {
    root: path.resolve(__dirname, 'admin'),
    envDir: __dirname,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'admin/src')
      }
    },
    server: {
      host,
      port: adminPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://${host}:${serverPort}`,
          changeOrigin: true
        }
      }
    }
  };
});
