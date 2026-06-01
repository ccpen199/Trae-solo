import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import fs from 'node:fs';

function readEnv(projectDir) {
  const env = {};
  const envPath = path.join(projectDir, '.env');
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^=#]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

export default defineConfig(({ mode }) => {
  const projectDir = path.resolve(__dirname, '..');
  const env = { ...process.env, ...readEnv(projectDir), ...loadEnv(mode, projectDir) };
  const frontendPort = Number(env.FRONTEND_PORT || 43453);
  const backendPort = Number(env.BACKEND_PORT || 53453);

  return {
    root: path.resolve(__dirname, '.'),
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: frontendPort,
      strictPort: true,
      clearScreen: false,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html')
        }
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify('1.0.0')
    }
  };
});
