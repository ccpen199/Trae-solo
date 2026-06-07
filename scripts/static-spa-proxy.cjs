const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || process.env.FRONTEND_PORT || 48943);
const apiTarget = new URL(process.env.API_TARGET || 'http://127.0.0.1:58943');
const root = path.resolve(process.env.STATIC_ROOT || path.join(__dirname, '..', 'dist'));

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'content-type': types[path.extname(file)] || 'application/octet-stream',
      'cache-control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    res.end(data);
  });
}

function proxy(req, res) {
  const target = new URL(req.url, apiTarget);
  const upstream = http.request(
    {
      hostname: target.hostname,
      port: target.port,
      path: target.pathname + target.search,
      method: req.method,
      headers: { ...req.headers, host: apiTarget.host },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on('error', (err) => {
    res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'backend unavailable', detail: err.message }));
  });
  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    proxy(req, res);
    return;
  }

  const urlPath = decodeURIComponent(new URL(req.url, `http://${host}:${port}`).pathname);
  const requested = path.resolve(root, `.${urlPath}`);
  const safePath = requested.startsWith(root) ? requested : path.join(root, 'index.html');
  fs.stat(safePath, (err, stat) => {
    if (!err && stat.isFile()) {
      sendFile(res, safePath);
      return;
    }
    sendFile(res, path.join(root, 'index.html'));
  });
});

server.listen(port, host, () => {
  console.log(`Static SPA ready on http://${host}:${port}, root=${root}, api=${apiTarget.href}`);
});
