import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const port = parseInt(env.FRONTEND_PORT) || 43408;

  return {
    plugins: [react()],
    server: {
      port: port,
      host: '127.0.0.1',
      strictPort: true
    },
    preview: {
      port: port,
      host: '127.0.0.1',
      strictPort: true
    }
  };
});
