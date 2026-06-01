const fs = require('fs');
const http = require('http');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = __dirname;
const env = readEnv(path.join(rootDir, '.env'));
const host = '127.0.0.1';
const frontendPort = Number.parseInt(env.FRONTEND_PORT || '43466', 10);
const backendPort = Number.parseInt(env.BACKEND_PORT || '53466', 10);

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
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end(body);
}

function proxyToBackend(req, res) {
  var options = {
    hostname: host,
    port: backendPort,
    path: req.url,
    method: req.method,
    headers: Object.assign({}, req.headers, {
      'host': host + ':' + backendPort,
      'origin': 'http://' + host + ':' + backendPort
    })
  };

  var proxyReq = http.request(options, function(proxyRes) {
    var body = [];
    proxyRes.on('data', function(chunk) { body.push(chunk); });
    proxyRes.on('end', function() {
      var data = Buffer.concat(body);
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      res.end(data);
    });
  });

  proxyReq.on('error', function(err) {
    console.error('Proxy error:', err.message);
    send(res, 502, JSON.stringify({ success: false, message: '后端服务不可用: ' + err.message }), 'application/json; charset=utf-8');
  });

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    var body = [];
    req.on('data', function(chunk) { body.push(chunk); });
    req.on('end', function() {
      proxyReq.write(Buffer.concat(body));
      proxyReq.end();
    });
  } else {
    proxyReq.end();
  }
}

http.createServer(function(req, res) {
  var url = req.url || '/';
  var pathname = url.split('?')[0];

  if (pathname === '/health') {
    return send(res, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8');
  }

  if (pathname.startsWith('/api/')) {
    return proxyToBackend(req, res);
  }

  if (pathname === '/config.js') {
    var configJs = 'window.APP_CONFIG=' + JSON.stringify({ backendUrl: '', useProxy: true }) + ';';
    return send(res, 200, configJs, types['.js']);
  }

  var target = path.resolve(publicDir, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!target.startsWith(publicDir)) return send(res, 403, 'Forbidden');

  fs.readFile(target, function(err, data) {
    if (err) {
      return fs.readFile(path.join(publicDir, 'index.html'), function(indexErr, indexData) {
        if (indexErr) return send(res, 404, 'Not found');
        send(res, 200, indexData, types['.html']);
      });
    }
    var ext = path.extname(target);
    send(res, 200, data, types[ext] || 'application/octet-stream');
  });
}).listen(frontendPort, host, function() {
  console.log('Frontend started: http://' + host + ':' + frontendPort);
  console.log('API proxy: /api/* -> http://' + host + ':' + backendPort);
});
