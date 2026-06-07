const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 48989;
const BACKEND_PORT = 58989;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function proxyRequest(req, res) {
  const options = {
    hostname: '127.0.0.1',
    port: BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers: Object.assign({}, req.headers, { host: '127.0.0.1:' + BACKEND_PORT }),
  };

  const proxy = http.request(options, function(proxyRes) {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxy.on('error', function() {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Backend unavailable' }));
  });

  req.pipe(proxy);
}

const server = http.createServer(function(req, res) {
  if (req.url && req.url.startsWith('/api/')) {
    proxyRequest(req, res);
    return;
  }

  var filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

  var ext = path.extname(filePath).toLowerCase();
  if (!ext || !MIME_TYPES[ext]) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  fs.readFile(filePath, function(err, data) {
    if (err) {
      filePath = path.join(DIST_DIR, 'index.html');
      fs.readFile(filePath, function(err2, fallbackData) {
        if (err2) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fallbackData);
      });
      return;
    }
    var contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', function() {
  console.log('SPA server running on http://127.0.0.1:' + PORT);
});
