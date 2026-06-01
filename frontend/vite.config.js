import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd() + '/..', '');
  
  return {
    plugins: [react()],
    server: {
      port: parseInt(env.FRONTEND_PORT) || 48901,
      host: '127.0.0.1',
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${parseInt(env.BACKEND_PORT) || 58901}`,
          changeOrigin: true
        }
      }
    },
    preview: {
      port: parseInt(env.FRONTEND_PORT) || 48901,
      host: '127.0.0.1',
      strictPort: true
    }
  };
});
