import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const FRONTEND_PORT = parseInt(env.FRONTEND_PORT || 49071);
  const BACKEND_PORT = parseInt(env.BACKEND_PORT || 59071);

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
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
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});
