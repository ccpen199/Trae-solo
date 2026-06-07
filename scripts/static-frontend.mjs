import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
const distDir = path.join(projectRoot, 'frontend', 'dist');

function readPort() {
  const fallback = 49025;
  if (!fs.existsSync(envPath)) return fallback;
  const env = fs.readFileSync(envPath, 'utf8');
  const match = env.match(/^FRONTEND_PORT=(\d+)/m);
  return match ? Number(match[1]) : fallback;
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname);
  const candidate = path.normalize(path.join(distDir, urlPath));
  const safeCandidate = candidate.startsWith(distDir) ? candidate : path.join(distDir, 'index.html');
  const filePath = fs.existsSync(safeCandidate) && fs.statSync(safeCandidate).isFile()
    ? safeCandidate
    : path.join(distDir, 'index.html');

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('frontend dist is not available');
      return;
    }

    res.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': filePath.endsWith('index.html') ? 'no-store' : 'public, max-age=31536000, immutable'
    });
    res.end(data);
  });
});

const port = readPort();
server.listen(port, '127.0.0.1', () => {
  console.log(`static frontend listening on http://127.0.0.1:${port}`);
});
