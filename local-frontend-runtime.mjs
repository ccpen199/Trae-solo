import { createServer } from 'vite';
import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, '.env') });

const target = process.argv[2] || 'user';
const appDir = target === 'admin' ? 'frontend-admin' : 'frontend-user';
const root = resolve(__dirname, appDir);
const configFile = resolve(root, 'vite.config.ts');

const host = process.env.FRONTEND_HOST || process.env.HOST || '127.0.0.1';
const port = Number(
  target === 'admin'
    ? process.env.FRONTEND_ADMIN_PORT || 50212
    : process.env.FRONTEND_USER_PORT || process.env.FRONTEND_PORT || process.env.APP_PORT || 49212,
);

const server = await createServer({
  root,
  configFile,
  server: {
    host,
    port,
    strictPort: true,
  },
});

await server.listen(port, host);
console.log(`${appDir} ready on http://${host}:${port}/`);
server.printUrls();

const close = async (signal) => {
  console.log(`${signal} received, closing ${appDir}`);
  await server.close();
  process.exit(0);
};

process.on('SIGTERM', () => {
  void close('SIGTERM');
});

process.on('SIGINT', () => {
  void close('SIGINT');
});
