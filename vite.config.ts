import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['HOST', 'FRONTEND_', 'BACKEND_', 'VITE_'])
  const frontendHost = env.FRONTEND_HOST || env.HOST || '127.0.0.1'
  const frontendPort = Number(env.FRONTEND_PORT || '49224')
  const backendHost = env.BACKEND_HOST || '127.0.0.1'
  const backendPort = Number(env.BACKEND_PORT || env.PORT || '59224')

  return {
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
      tsconfigPaths(),
    ],
    server: {
      host: frontendHost,
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://${backendHost}:${backendPort}`,
          changeOrigin: true,
          secure: false,
        }
      }
    },
    preview: {
      host: frontendHost,
      port: frontendPort,
      strictPort: true,
    }
  }
})
