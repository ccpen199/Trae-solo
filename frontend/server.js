const fs = require('fs');
const http = require('http');
const path = require('path');

const projectDir = path.resolve(__dirname, '..');
const distDir = path.join(__dirname, 'dist');
const publicDir = fs.existsSync(distDir) ? distDir : __dirname;

function readEnv() {
  const envPath = path.join(projectDir, '.env');
  const env = {};
  if (!fs.existsSync(envPath)) {
    return env;
  }

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^=#]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const env = readEnv();
const frontendPort = Number(env.FRONTEND_PORT || 43455);
const backendPort = Number(env.BACKEND_PORT || 53455);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function proxyApi(req, res) {
  const upstream = http.request({
    hostname: '127.0.0.1',
    port: backendPort,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${backendPort}`,
    },
  }, (apiRes) => {
    res.writeHead(apiRes.statusCode || 502, apiRes.headers);
    apiRes.pipe(res);
  });

  upstream.on('error', (error) => {
    res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: error.message }));
  });

  req.pipe(upstream);
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://127.0.0.1:${frontendPort}`);
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const normalized = path.normalize(path.join(publicDir, decodeURIComponent(pathname)));
  const safePath = normalized.startsWith(publicDir) ? normalized : path.join(publicDir, 'index.html');
  const filePath = fs.existsSync(safePath) && fs.statSync(safePath).isFile()
    ? safePath
    : path.join(publicDir, 'index.html');

  res.writeHead(200, {
    'content-type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith('/api')) {
    proxyApi(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(frontendPort, '127.0.0.1', () => {
  console.log(`Escort frontend listening at http://127.0.0.1:${frontendPort}`);
  console.log(`Proxying API requests to http://127.0.0.1:${backendPort}`);
});
