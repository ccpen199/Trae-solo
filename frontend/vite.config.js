import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  const env = {};
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
  } catch (e) {}
  return env;
}

const env = loadEnv();

export default defineConfig(() => {
  const port = parseInt(env.FRONTEND_PORT) || 41841;
  const backendPort = parseInt(env.BACKEND_PORT) || 51841;
  
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true
        }
      }
    }
  };
});
