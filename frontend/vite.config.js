import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, '../') };
  
  return {
    plugins: [react()],
    server: {
      port: parseInt(process.env.FRONTEND_PORT) || 46881,
      host: '127.0.0.1',
      strictPort: true
    }
  };
});
