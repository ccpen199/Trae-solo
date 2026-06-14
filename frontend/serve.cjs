const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.FRONTEND_PORT) || 49034;
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT) || 59034;

app.use('/api', (req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: BACKEND_PORT,
    path: req.originalUrl,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${BACKEND_PORT}` }
  };
  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxy.on('error', (e) => {
    res.status(502).json({ error: '代理错误' });
  });
  req.pipe(proxy);
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`前端服务器运行在 http://127.0.0.1:${PORT}`);
  console.log(`API代理到 http://127.0.0.1:${BACKEND_PORT}`);
});
