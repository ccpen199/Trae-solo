import http from 'node:http';
import { URL } from 'node:url';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || 59303);
const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:49303';

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': frontendUrl,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendJson(res, 400, { status: 'error', message: 'Missing request URL' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': frontendUrl,
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${host}:${port}`);

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'photo-print-studio-api',
      timestamp: new Date().toISOString(),
      frontendUrl,
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/meta') {
    sendJson(res, 200, {
      project: 'may-89303',
      mode: 'local-mock-api',
      notes: 'This project is frontend-driven; the local API only provides health metadata.',
    });
    return;
  }

  sendJson(res, 404, {
    status: 'not_found',
    message: 'API route not found',
    path: url.pathname,
  });
});

server.listen(port, host, () => {
  console.log(`Mock API listening on http://${host}:${port}`);
});
