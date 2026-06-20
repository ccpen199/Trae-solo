import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), '');
  const host = env.HOST || '127.0.0.1';
  const frontendPort = Number.parseInt(env.FRONTEND_PORT || env.APP_PORT || '49274', 10);
  const backendPort = Number.parseInt(env.BACKEND_PORT || '59274', 10);

  return {
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
      host,
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://${host}:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host,
      port: frontendPort,
      strictPort: true,
    },
  };
})
