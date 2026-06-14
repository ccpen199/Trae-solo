import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, resolve(__dirname, '../..'), '');
  const localEnv = loadEnv(mode, __dirname, '');
  const env = { ...rootEnv, ...localEnv };
  const frontendHost = env.FRONTEND_HOST || env.HOST || '127.0.0.1';
  const backendTarget =
    env.VITE_API_TARGET ||
    env.VITE_API_URL ||
    env.API_BASE_URL ||
    `http://127.0.0.1:${env.BACKEND_PORT || 59189}`;

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@shared': resolve(__dirname, '../../packages/shared/src'),
      },
    },
    server: {
      host: frontendHost,
      port: Number(env.ADMIN_FRONTEND_PORT || 49199),
      strictPort: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
