const fs = require('fs');
const http = require('http');
const path = require('path');

const host = '127.0.0.1';
const port = Number(process.env.FRONTEND_PORT || 43468);
const root = path.resolve(__dirname, '../frontend/dist');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'));

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const candidate = path.join(root, normalized === '/' ? 'index.html' : normalized);
  if (!candidate.startsWith(root)) return path.join(root, 'index.html');
  return candidate;
}

const server = http.createServer((req, res) => {
  let filePath = safePath(req.url || '/');
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(root, 'index.html');
  }

  const body = path.basename(filePath) === 'index.html'
    ? indexHtml
    : fs.readFileSync(filePath);

  res.writeHead(200, {
    'Content-Type': types[path.extname(filePath)] || 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': path.basename(filePath) === 'index.html' ? 'no-cache' : 'public, max-age=3600'
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.end(body);
});

server.listen(port, host, () => {
  console.log(`Static frontend listening on http://${host}:${port}/`);
});
