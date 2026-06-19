import process from 'node:process';
import { loadEnv, preview } from 'vite';

const env = loadEnv('production', process.cwd(), '');
const host = env.FRONTEND_HOST || '127.0.0.1';
const port = Number(env.FRONTEND_PORT || 49263);

const server = await preview({
  configFile: 'vite.config.ts',
  preview: {
    host,
    port,
    strictPort: true,
  },
});

server.printUrls();

const shutdown = async (signal) => {
  console.log(`[frontend] received ${signal}, shutting down preview server`);
  await server.close();
  process.exit(0);
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
