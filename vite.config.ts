import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const host = env.HOST || '127.0.0.1'
  const frontendPort = Number(env.FRONTEND_PORT || env.VITE_PORT || 49180)
  const backendPort = Number(env.BACKEND_PORT || env.PORT || 59180)
  const apiBaseUrl = env.VITE_API_BASE_URL || env.VITE_API_URL || `http://${host}:${backendPort}`

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
      port: frontendPort,
      strictPort: true,
      host,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
