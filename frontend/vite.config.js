import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function readRootEnv() {
  try {
    return Object.fromEntries(
      readFileSync(new URL('../.env', import.meta.url), 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const idx = line.indexOf('=');
          return [line.slice(0, idx), line.slice(idx + 1)];
        }),
    );
  } catch {
    return {};
  }
}

export default defineConfig(() => {
  const rootEnv = readRootEnv();
  const frontendPort = Number(process.env.FRONTEND_PORT || rootEnv.FRONTEND_PORT || 49063);
  const backendPort = Number(process.env.BACKEND_PORT || rootEnv.BACKEND_PORT || 59063);

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      strictPort: true,
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            antd: ['antd', '@ant-design/icons'],
            react: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  };
});
