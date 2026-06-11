import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import { viteMockServe } from 'vite-plugin-mock'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const host = env.HOST || '127.0.0.1'
  const frontendPort = Number(env.FRONTEND_PORT || 49156)
  const backendPort = env.BACKEND_PORT || '59156'

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
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
      viteMockServe({
        mockPath: 'mock',
        enable: true,
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
          secure: false,
        },
      },
    },
  }
})
