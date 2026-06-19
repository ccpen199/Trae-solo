import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const host = env.VITE_HOST || '127.0.0.1';
  const port = Number(env.VITE_PORT || 49242);
  const apiTarget = env.VITE_API_TARGET || 'http://127.0.0.1:59242';

  return {
    plugins: [react()],
    server: {
      host,
      port,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
