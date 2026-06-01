const http = require('http');

const PORT = 54383;

const server = http.createServer((req, res) => {
  const url = req.url;
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let delay = 0;
  if (url.includes('slow')) {
    delay = Math.random() * 500 + 100;
  } else {
    delay = Math.random() * 100 + 10;
  }

  setTimeout(() => {
    if (url.startsWith('/api/users')) {
      res.writeHead(200);
      res.end(JSON.stringify({
        code: 0,
        message: 'success',
        data: [
          { id: 1, name: '张三', role: 'admin' },
          { id: 2, name: '李四', role: 'user' },
          { id: 3, name: '王五', role: 'editor' }
        ],
        timestamp: Date.now()
      }));
    } else if (url.startsWith('/api/health')) {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'ok',
        uptime: process.uptime()
      }));
    } else if (url.startsWith('/api/data')) {
      res.writeHead(200);
      res.end(JSON.stringify({
        code: 0,
        data: {
          items: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            value: Math.random() * 100,
            timestamp: Date.now()
          }))
        }
      }));
    } else if (url.startsWith('/api/error') && Math.random() > 0.5) {
      res.writeHead(500);
      res.end(JSON.stringify({
        code: 500,
        message: 'Internal Server Error',
        detail: '模拟错误接口'
      }));
    } else {
      res.writeHead(200);
      res.end(JSON.stringify({
        message: 'Demo API Server',
        path: url,
        method: req.method,
        delay: delay.toFixed(0) + 'ms'
      }));
    }
  }, delay);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Demo API Server running at http://127.0.0.1:${PORT}`);
  console.log('可用测试接口:');
  console.log('  GET /api/health  - 健康检查');
  console.log('  GET /api/users   - 用户列表');
  console.log('  GET /api/data    - 数据接口');
  console.log('  GET /api/slow    - 慢接口(100-600ms)');
  console.log('  GET /api/error   - 随机错误接口');
});
