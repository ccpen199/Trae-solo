const http = require('http');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'dist');
const BACKEND_PORT = process.env.BACKEND_PORT || 59101;
const BACKEND_HOST = '127.0.0.1';

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

function proxyRequest(req, res) {
  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `${BACKEND_HOST}:${BACKEND_PORT}` }
  };
  delete options.headers['accept-encoding'];

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 502, message: '后端服务不可用', data: null }));
  });

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => {
      proxy.write(Buffer.concat(body));
      proxy.end();
    });
  } else {
    proxy.end();
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    proxyRequest(req, res);
    return;
  }

  let filePath = path.join(dir, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  if (!mime[ext]) filePath = path.join(dir, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/html' });
    res.end(data);
  });
});

server.listen(49101, '127.0.0.1', () => {
  console.log('Frontend serving on http://127.0.0.1:49101 (API proxied to :59101)');
});
