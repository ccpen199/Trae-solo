import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(process.cwd(), '..'), '');
  const localEnv = loadEnv(mode, process.cwd(), '');
  const env = { ...rootEnv, ...localEnv };
  const frontendPort = parseInt(env.FRONTEND_PORT || env.VITE_PORT || '49194', 10);
  const frontendHost = env.FRONTEND_HOST || env.HOST || '127.0.0.1';
  const backendPort = env.VITE_BACKEND_PORT || env.BACKEND_PORT || env.PORT || '59194';
  const apiPrefix = env.VITE_API_PREFIX || '/api';

  return {
    server: {
      port: frontendPort,
      host: frontendHost,
      strictPort: true,
      proxy: {
        [apiPrefix]: {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        },
        '/health': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: frontendPort,
      host: frontendHost,
      strictPort: true,
    },
    build: {
      sourcemap: 'hidden',
    },
    plugins: [
      react({
        babel: {
          plugins: ['react-dev-locator'],
        },
      }),
      traeBadgePlugin({
        variant: 'dark',
        position: 'bottom-right',
        prodOnly: true,
        clickable: true,
        clickUrl: 'https://www.trae.ai/solo?showJoin=1',
        autoTheme: true,
        autoThemeTarget: '#root',
      }),
      tsconfigPaths(),
    ],
  };
});
