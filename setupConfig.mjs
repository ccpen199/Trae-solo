import fs from 'fs';

const viteConfig = `import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const FRONTEND_PORT = parseInt(env.FRONTEND_PORT || '43460', 10)
  const BACKEND_PORT = parseInt(env.BACKEND_PORT || '53460', 10)

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
      host: '127.0.0.1',
      port: FRONTEND_PORT,
      strictPort: true,
      proxy: {
        '/api': {
          target: \`http://127.0.0.1:\${BACKEND_PORT}\`,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
`;

const serverTs = `/**
 * local server entry file, for local development
 */
import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.BACKEND_PORT || '53460', 10);
const HOST = '127.0.0.1';

const server = app.listen(PORT, HOST, () => {
  console.log(\`Server ready on http://\${HOST}:\${PORT}\`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
`;

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  "client:dev": "vite --host 127.0.0.1 --port 43460 --strictPort",
  "server:dev": "BACKEND_PORT=53460 nodemon",
  "dev": "concurrently \"npm run client:dev\" \"npm run server:dev\""
};

const nodemonJson = {
  "watch": ["api"],
  "ext": "ts,mts,js,json",
  "ignore": ["api/dist/*"],
  "exec": "tsx api/server.ts",
  "env": {
    "NODE_ENV": "development",
    "BACKEND_PORT": "53460"
  },
  "delay": 1000
};

fs.writeFileSync('vite.config.ts', viteConfig);
console.log('vite.config.ts written');

fs.writeFileSync('api/server.ts', serverTs);
console.log('api/server.ts written');

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('package.json written');

fs.writeFileSync('nodemon.json', JSON.stringify(nodemonJson, null, 2));
console.log('nodemon.json written');

console.log('All config files updated successfully!');
