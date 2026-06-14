import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

loadEnv(join(rootDir, '.env'));

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.FRONTEND_PORT || 49144);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${host}:${port}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const candidate = normalize(join(distDir, pathname));
  const filePath = candidate.startsWith(distDir) && existsSync(candidate) && statSync(candidate).isFile()
    ? candidate
    : join(distDir, 'index.html');

  if (!existsSync(filePath)) {
    res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('dist/index.html not found. Run npm run build:h5 first.');
    return;
  }

  const ext = extname(filePath);
  res.writeHead(200, {
    'content-type': mimeTypes[ext] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(filePath).pipe(res);
});

server.listen(port, host, () => {
  console.log(`Frontend ready at http://${host}:${port}/`);
});

function loadEnv(path) {
  if (!existsSync(path)) {
    return;
  }

  parseEnv(readFileSync(path, 'utf8'));
}

function parseEnv(source) {
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const index = trimmed.indexOf('=');
    if (index === -1) {
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
