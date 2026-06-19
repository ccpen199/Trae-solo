import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawPort = Number(env.VITE_PORT || 5175)
  const host = env.VITE_HOST || '127.0.0.1'
  const port = rawPort > 40000 ? 5175 : rawPort
  const rawApiPort = Number(env.PORT || 3003)
  const apiPort = rawApiPort > 40000 ? 3003 : rawApiPort
  const apiBaseUrl = env.VITE_API_BASE_URL || `http://${env.HOST || '127.0.0.1'}:${apiPort}`

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
      host,
      port,
      strictPort: false,
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
