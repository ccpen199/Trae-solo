import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '');
  const port = parseInt(env.FRONTEND_PORT) || 48927;
  
  return {
    plugins: [react()],
    server: {
      port: port,
      strictPort: true,
      host: '127.0.0.1'
    },
    preview: {
      port: port,
      strictPort: true,
      host: '127.0.0.1'
    },
    envDir: '..',
    envPrefix: 'VITE_'
  };
});
