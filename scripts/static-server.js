const fs = require('fs');
const http = require('http');
const path = require('path');

const host = '127.0.0.1';
const port = Number(process.env.FRONTEND_PORT || 43470);
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
  const filePath = safePath(req.url || '/');
  if (path.basename(filePath) !== 'index.html') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': indexHtml.length,
    'Cache-Control': 'no-cache'
  });
  res.end(indexHtml);
});

server.listen(port, host, () => {
  console.log(`Static frontend listening on http://${host}:${port}/`);
});
