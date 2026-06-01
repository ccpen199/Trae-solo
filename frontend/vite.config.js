import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseEnv(content) {
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });
  return env;
}

export default defineConfig(({ mode }) => {
  const envPath = path.resolve(__dirname, '..', '.env');
  let envContent = '';
  let envVars = {};
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    envVars = parseEnv(envContent);
  }
  
  const port = envVars.FRONTEND_PORT ? parseInt(envVars.FRONTEND_PORT) : 43387;

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(envVars.VITE_API_BASE_URL || 'http://127.0.0.1:63387/api')
    },
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true
    },
    preview: {
      host: '127.0.0.1',
      port: port,
      strictPort: true
    }
  };
});
