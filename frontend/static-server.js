import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.FRONTEND_PORT || 49103);
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const distRoot = path.join(projectRoot, 'dist');
const root = fs.existsSync(path.join(distRoot, 'index.html')) ? distRoot : projectRoot;

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${host}:${port}`);
  const safePath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.join(root, safePath.replace(/^\/+/, ''));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      fs.readFile(path.join(root, 'index.html'), (indexError, indexData) => {
        if (indexError) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': contentTypes['.html'] });
        res.end(indexData);
      });
      return;
    }

    res.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, host, () => {
  console.log(`may-89103 frontend listening on http://${host}:${port}`);
});
