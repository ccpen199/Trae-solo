const http = require('http');

async function testAPI() {
  console.log('=== 测试登录 API ===');
  
  const data = JSON.stringify({ email: 'hr@zhilian.com', password: '123456' });

  const options = {
    hostname: '127.0.0.1',
    port: 61099,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      console.log('Status:', res.statusCode);
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('Response:', body);
        resolve(body);
      });
    });

    req.on('error', (e) => {
      console.error('Error:', e.message);
      resolve(null);
    });
    
    req.write(data);
    req.end();
  });
}

testAPI();
