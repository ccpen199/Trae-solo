import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

try {
  const envPath = resolve(process.cwd(), '..', '.env');
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (!process.env[key]) process.env[key] = rest.join('=');
  }
} catch {
  try {
    const env = readFileSync('.env', 'utf8');
    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (!process.env[key]) process.env[key] = rest.join('=');
    }
  } catch {
    // .env is optional for local starts.
  }
}

const FRONTEND_HOST = process.env.FRONTEND_HOST || process.env.HOST || '127.0.0.1';
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || process.env.APP_PORT || 49203);
const BACKEND_HOST = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1';
const BACKEND_PORT = process.env.BACKEND_PORT || process.env.PORT || '59203';

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths()
  ],
  server: {
    host: FRONTEND_HOST,
    port: FRONTEND_PORT,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://${BACKEND_HOST}:${BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: FRONTEND_HOST,
    port: FRONTEND_PORT,
  },
})
