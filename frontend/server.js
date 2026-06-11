const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const projectDir = path.resolve(__dirname, '..');
loadEnv(path.join(projectDir, '.env'));

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.FRONTEND_PORT || 49102);
const apiBase = process.env.API_BASE_URL || `http://127.0.0.1:${process.env.BACKEND_PORT || 59102}/api`;
const root = __dirname;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8'
};

http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${host}:${port}`);
  if (url.pathname === '/api-config.js') {
    res.writeHead(200, { 'Content-Type': types['.js'], 'Cache-Control': 'no-store' });
    res.end(`window.API_BASE=${JSON.stringify(apiBase)};`);
    return;
  }

  let file = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
  file = file.replace(/\.\./g, '');
  const fullPath = path.join(root, file);

  fs.readFile(fullPath, (error, data) => {
    if (error) {
      fs.readFile(path.join(root, 'index.html'), (fallbackError, fallbackData) => {
        if (fallbackError) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': types['.html'], 'Cache-Control': 'no-store' });
        res.end(fallbackData);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(fullPath)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, host, () => {
  console.log(`Frontend ready on http://${host}:${port}`);
});

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}
