const fs = require('fs');
const http = require('http');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const env = readEnv(path.join(rootDir, '.env'));
const host = '127.0.0.1';
const frontendPort = Number.parseInt(env.FRONTEND_PORT || '43471', 10);
const backendPort = Number.parseInt(env.BACKEND_PORT || '53471', 10);
const backendUrl = `http://${host}:${backendPort}`;

function readEnv(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const index = line.indexOf('=');
    if (index > -1) result[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return result;
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

http.createServer((req, res) => {
  const pathname = (req.url || '/').split('?')[0];
  if (pathname === '/health') return send(res, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8');
  if (pathname === '/config.js') return send(res, 200, `window.APP_CONFIG=${JSON.stringify({ backendUrl })};`, types['.js']);
  const target = path.resolve(__dirname, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!target.startsWith(__dirname)) return send(res, 403, 'Forbidden');
  fs.readFile(target, (err, data) => {
    if (err) return fs.readFile(path.join(__dirname, 'index.html'), (indexErr, indexData) => {
      if (indexErr) return send(res, 404, 'Not found');
      send(res, 200, indexData, types['.html']);
    });
    send(res, 200, data, types[path.extname(target)] || 'application/octet-stream');
  });
}).listen(frontendPort, host, () => {
  console.log(`Frontend started: http://${host}:${frontendPort}`);
  console.log(`Backend configured: ${backendUrl}`);
});
