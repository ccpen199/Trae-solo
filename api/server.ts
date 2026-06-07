import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { default: app } = await import('./app.js');

const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 58943);
const HOST = '127.0.0.1';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`);
});

server.on('error', (error) => {
  console.error('Server listen error:', error);
});

const keepAlive = setInterval(() => {}, 2147483647);

process.on('beforeExit', (code) => {
  console.error(`Process beforeExit: ${code}`);
});

process.on('exit', (code) => {
  console.error(`Process exit: ${code}`);
});

process.on('SIGHUP', () => {
  console.error('Process received SIGHUP');
});

process.on('SIGTERM', () => {
  console.error('Process received SIGTERM');
  clearInterval(keepAlive);
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.error('Process received SIGINT');
  clearInterval(keepAlive);
  server.close(() => {
    process.exit(0);
  });
});
