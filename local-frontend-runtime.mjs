import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, '.env');
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const target = process.argv[2] || 'user';
const appDir = target === 'admin' ? 'web-admin' : 'web-user';
const root = resolve(__dirname, appDir);
const configFile = resolve(root, 'vite.config.ts');

process.chdir(root);

const requireFromApp = createRequire(resolve(root, 'package.json'));
const viteEntry = requireFromApp.resolve('vite');
const { createServer } = await import(pathToFileURL(viteEntry).href);

const host = process.env.FRONTEND_HOST || process.env.HOST || '127.0.0.1';
const port = Number(
  target === 'admin'
    ? process.env.FRONTEND_ADMIN_PORT || 50223
    : process.env.FRONTEND_USER_PORT || process.env.FRONTEND_PORT || process.env.APP_PORT || 49223,
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
