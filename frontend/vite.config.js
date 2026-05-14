import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd() + '/..', '');
  const BACKEND_PORT = env.BACKEND_PORT || 9941;
  const FRONTEND_PORT = parseInt(env.FRONTEND_PORT || 9942);

  return {
    plugins: [vue()],
    server: {
      host: 'localhost',
      port: FRONTEND_PORT,
      proxy: {
        '/api': {
          target: `http://localhost:${BACKEND_PORT}`,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: 'localhost',
      port: FRONTEND_PORT
    }
  };
});
