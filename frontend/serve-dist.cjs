const fs = require('fs');
const http = require('http');
const path = require('path');

const projectDir = path.resolve(__dirname, '..');
const distDir = path.join(__dirname, 'dist');
const envPath = path.join(projectDir, '.env');

function readEnvPort(name, fallback) {
  try {
    const env = fs.readFileSync(envPath, 'utf8');
    const match = env.match(new RegExp(`^${name}=(\\d+)`, 'm'));
    return match ? Number(match[1]) : fallback;
  } catch (e) {
    return fallback;
  }
}

const frontendPort = readEnvPort('FRONTEND_PORT', 49075);
const backendPort = readEnvPort('BACKEND_PORT', 59075);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function proxyApi(req, res) {
  const options = {
    hostname: '127.0.0.1',
    port: backendPort,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${backendPort}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ code: 502, message: `后端代理失败: ${err.message}` }));
  });

  req.pipe(proxyReq);
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    proxyApi(req, res);
    return;
  }

  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const requestedPath = path.join(distDir, safePath);

  if (requestedPath.startsWith(distDir) && fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
    sendFile(res, requestedPath);
    return;
  }

  sendFile(res, path.join(distDir, 'index.html'));
});

server.listen(frontendPort, '127.0.0.1', () => {
  console.log(`前端静态服务: http://127.0.0.1:${frontendPort}`);
  console.log(`API 代理目标: http://127.0.0.1:${backendPort}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
