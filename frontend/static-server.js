import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.FRONTEND_PORT || 49092);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 404, 'Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(filePath)] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': filePath.endsWith('index.html') ? 'no-store' : 'public, max-age=31536000, immutable',
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url || '/', `http://${host}:${port}`).pathname);
  const requested = path.normalize(path.join(distDir, urlPath));
  if (!requested.startsWith(distDir)) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.stat(requested, (error, stat) => {
    if (!error && stat.isFile()) {
      serveFile(res, requested);
      return;
    }
    serveFile(res, path.join(distDir, 'index.html'));
  });
});

server.listen(port, host, () => {
  console.log(`Frontend static server listening on http://${host}:${port}`);
  console.log(`Serving ${distDir}`);
});
