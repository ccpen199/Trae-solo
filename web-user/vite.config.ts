import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const host = rootEnv.FRONTEND_HOST || rootEnv.HOST || '127.0.0.1';
  const port = Number(rootEnv.FRONTEND_USER_PORT || rootEnv.FRONTEND_PORT || rootEnv.APP_PORT || 49223);
  const backendHost = rootEnv.BACKEND_HOST || rootEnv.HOST || '127.0.0.1';
  const backendPort = Number(rootEnv.BACKEND_PORT || rootEnv.PORT || 59223);

  return {
    envDir: '..',
    server: {
      host,
      port,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://${backendHost}:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
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
  };
})
