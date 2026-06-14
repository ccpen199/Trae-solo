import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const FRONTEND_PORT = Number(env.FRONTEND_PORT || env.APP_PORT) || 49191;
  const FRONTEND_HOST = env.FRONTEND_HOST || env.HOST || '127.0.0.1';
  const API_PORT = Number(env.VITE_API_PORT) || 3001;
  const API_BASE = env.VITE_API_BASE || `http://127.0.0.1:${API_PORT}`;

  return {
    server: {
      port: FRONTEND_PORT,
      host: FRONTEND_HOST,
      strictPort: true,
      proxy: {
        '/api': {
          target: API_BASE,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: FRONTEND_PORT,
      host: FRONTEND_HOST,
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
});
