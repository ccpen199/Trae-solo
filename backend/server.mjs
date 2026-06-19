import http from 'node:http';

const host = process.env.BACKEND_HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_PORT || 59263);
const frontendHost = process.env.FRONTEND_HOST || '127.0.0.1';
const frontendPort = Number(process.env.FRONTEND_PORT || 49263);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
}

function buildOverview() {
  return {
    ok: true,
    project: 'may-89263',
    service: 'changping-media-center-api',
    status: 'online',
    message: 'Frontend and backend are running on loopback ports.',
    checkedAt: new Date().toISOString(),
    frontendUrl: `http://${frontendHost}:${frontendPort}/`,
    backendUrl: `http://${host}:${port}`,
    sqlite: {
      enabled: false,
      reason: 'This project does not define a SQLite layer in the repository.',
    },
  };
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendJson(res, 400, { ok: false, error: 'Missing request URL.' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  if (req.url === '/api/health') {
    sendJson(res, 200, buildOverview());
    return;
  }

  if (req.url === '/api/overview') {
    sendJson(res, 200, {
      ...buildOverview(),
      metrics: {
        activeReporters: 23,
        queuedArticles: 12,
        pendingReviews: 4,
      },
    });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'Not found.' });
});

server.listen(port, host, () => {
  console.log(`[backend] listening on http://${host}:${port}`);
});
