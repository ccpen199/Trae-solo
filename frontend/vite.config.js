import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'));
  const port = parseInt(env.FRONTEND_PORT) || 48840;
  
  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${parseInt(env.BACKEND_PORT) || 58840}`,
          changeOrigin: true
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  };
});
