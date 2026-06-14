import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(process.cwd(), '../..'), '');
  const localEnv = loadEnv(mode, process.cwd(), '');
  const env = { ...rootEnv, ...localEnv };
  const frontendPort = Number(env.FRONTEND_PORT || env.VITE_PORT || 49188);
  const frontendHost = env.FRONTEND_HOST || env.HOST || '127.0.0.1';
  const backendTarget =
    env.VITE_API_URL ||
    env.VITE_API_BASE ||
    env.API_BASE_URL ||
    `http://127.0.0.1:${env.BACKEND_PORT || 59188}`;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      include: ['@iot/shared'],
    },
    server: {
      port: frontendPort,
      host: frontendHost,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/docs': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: frontendPort,
      host: frontendHost,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
