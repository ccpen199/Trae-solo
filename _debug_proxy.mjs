import http from 'http';

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: 'localhost', port: 5173, path, method: 'GET' },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, url: path }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5173,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, url: path, data: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode, url: path, data: d.slice(0, 200) }); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function test() {
  console.log('=== 测试 Vite 代理 ===');
  
  console.log('\nTest 1: /api/auth/send-code (前端代理路径)');
  const r1 = await post('/api/auth/send-code', { phone: '13800138000' });
  console.log('Status:', r1.status, 'URL:', r1.url);
  console.log('Data:', r1.data);

  console.log('\nTest 2: /api/api/auth/send-code (双倍 api 路径)');
  const r2 = await post('/api/api/auth/send-code', { phone: '13800138000' });
  console.log('Status:', r2.status, 'URL:', r2.url);
  console.log('Data:', r2.data);

  console.log('\nTest 3: /api/auth/login (正确路径)');
  const r3 = await post('/api/auth/login', { phone: '13800138000' });
  console.log('Status:', r3.status);
  console.log('Data:', r3.data);
}

test().catch(console.error);
