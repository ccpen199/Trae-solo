import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT || '48831'),
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${env.BACKEND_PORT || '58831'}`,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT || '48831'),
      strictPort: true,
    },
  };
});
