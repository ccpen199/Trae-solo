const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const loadRootEnv = () => {
  const envFile = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envFile)) return;

  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([^=\s]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] === undefined) {
      process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
    }
  }
};

loadRootEnv();

const port = Number(process.env.FRONTEND_PORT || 48822);
const backendPort = Number(process.env.BACKEND_PORT || 58822);
const apiTarget = new URL(process.env.API_BASE_URL || `http://127.0.0.1:${backendPort}`);
const distDir = path.join(__dirname, 'dist');
const indexFile = path.join(distDir, 'index.html');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const sendFile = (res, filePath) => {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(error.code === 'ENOENT' ? 'Not found' : 'Static server error');
      return;
    }

    res.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': filePath === indexFile ? 'no-store' : 'no-cache, must-revalidate'
    });
    res.end(data);
  });
};

const stripViteHash = (fileName) => {
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext);

  if (baseName.length <= 9 || baseName[baseName.length - 9] !== '-') {
    return null;
  }

  return {
    stem: baseName.slice(0, -9),
    ext
  };
};

const findCurrentHashedAsset = (decodedPath) => {
  if (!decodedPath.startsWith('/assets/')) return null;

  const requested = stripViteHash(path.basename(decodedPath));
  if (!requested) return null;

  const assetsDir = path.join(distDir, 'assets');
  let files;

  try {
    files = fs.readdirSync(assetsDir);
  } catch (error) {
    return null;
  }

  const candidates = files
    .map((fileName) => ({ fileName, parsed: stripViteHash(fileName) }))
    .filter(({ parsed }) => parsed && parsed.stem === requested.stem && parsed.ext === requested.ext)
    .map(({ fileName }) => path.join(assetsDir, fileName))
    .filter((filePath) => fs.existsSync(filePath))
    .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);

  return candidates[0] || null;
};

const normalizeRequestPath = (rawUrl) => {
  const requestPath = rawUrl || '/';
  return requestPath.startsWith('//')
    ? `/${requestPath.replace(/^\/+/, '')}`
    : requestPath;
};

const proxyApi = (req, res, requestPath) => {
  const options = {
    protocol: apiTarget.protocol,
    hostname: apiTarget.hostname,
    port: apiTarget.port,
    method: req.method,
    path: requestPath,
    headers: {
      ...req.headers,
      host: apiTarget.host
    }
  };

  const upstream = http.request(options, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
    upstreamRes.pipe(res);
  });

  upstream.on('error', (error) => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Bad Gateway', detail: error.message }));
  });

  req.pipe(upstream);
};

const parseRequestUrl = (rawUrl) => {
  const normalizedPath = normalizeRequestPath(rawUrl);
  return new URL(normalizedPath || '/', `http://127.0.0.1:${port}`);
};

const server = http.createServer((req, res) => {
  const requestPath = normalizeRequestPath(req.url);

  if (requestPath.startsWith('/api/')) {
    proxyApi(req, res, requestPath);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
    return;
  }

  let requestUrl;
  let decodedPath;

  try {
    requestUrl = parseRequestUrl(requestPath);
    decodedPath = decodeURIComponent(requestUrl.pathname);
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  const requestedFile = path.normalize(path.join(distDir, decodedPath));

  if (!requestedFile.startsWith(distDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(requestedFile, (error, stat) => {
    if (!error && stat.isFile()) {
      sendFile(res, requestedFile);
      return;
    }

    if (path.extname(decodedPath)) {
      const fallbackAsset = findCurrentHashedAsset(decodedPath);
      if (fallbackAsset) {
        sendFile(res, fallbackAsset);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    sendFile(res, indexFile);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Frontend static server running on http://127.0.0.1:${port}/`);
});
