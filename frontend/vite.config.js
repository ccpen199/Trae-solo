import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig(() => {
  const envPath = path.resolve(__dirname, '../.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
  
  const frontendPort = parseInt(envVars.FRONTEND_PORT) || 43483;
  const backendPort = parseInt(envVars.BACKEND_PORT) || 53483;
  
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true
        }
      }
    },
    envDir: '../',
    envPrefix: 'VITE_'
  };
});
