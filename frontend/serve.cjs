const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.join(__dirname, 'dist');
const port = Number(process.env.FRONTEND_PORT || 49039);
const backendPort = Number(process.env.BACKEND_PORT || 59039);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

function proxyApi(req, res) {
  const proxy = http.request({
    hostname: '127.0.0.1',
    port: backendPort,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${backendPort}` },
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxy.on('error', () => {
    res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'API proxy failed' }));
  });

  req.pipe(proxy);
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, body) => {
    if (error) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'content-type': contentTypes[ext] || 'application/octet-stream' });
    res.end(body);
  });
}

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith('/api')) {
    proxyApi(req, res);
    return;
  }

  const cleanPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const requested = cleanPath === '/' ? '/index.html' : cleanPath;
  const filePath = path.normalize(path.join(root, requested));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(res, filePath);
    return;
  }

  sendFile(res, path.join(root, 'index.html'));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Frontend static server ready on http://127.0.0.1:${port}`);
  console.log(`API proxy target http://127.0.0.1:${backendPort}`);
});
