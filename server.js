const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 43438;
const API_TARGET = 'http://127.0.0.1:53437';
const DIST_DIR = path.join(__dirname, 'frontend', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json'
};

function proxyRequest(req, res) {
  const http = require('http');
  const { URL } = require('url');
  const targetUrl = API_TARGET + req.url;
  const parsed = new URL(targetUrl);
  
  const options = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: parsed.pathname + parsed.search,
    method: req.method,
    headers: { ...req.headers, host: parsed.hostname + ':' + parsed.port
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', details: err.message }));
  });

  req.pipe(proxyReq);
}

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0];
  
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(DIST_DIR, urlPath);
  
  try {
    const stats = fs.statSync(filePath);
    if (stats.isFile() ? (() => {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return true;
    })() : (() => { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not Found'); return true; })();
  } catch (err) {
    if (err.code === 'ENOENT') {
      const indexPath = path.join(DIST_DIR, 'index.html');
      try {
        const stats = fs.statSync(indexPath);
        if (stats.isFile()) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          fs.createReadStream(indexPath).pipe(res);
        } else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not Found'); }
      } catch (err2) { res.writeHead(500, { 'Content-Type': 'text/plain' }); res.end('Server Error'); }
    } else { res.writeHead(500, { 'Content-Type': 'text/plain' }); res.end('Server Error'); }
  }
}

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  if (req.url.startsWith('/api/')) proxyRequest(req, res);
  else serveStatic(req, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});
});
