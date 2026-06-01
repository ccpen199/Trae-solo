const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 53382,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const token = JSON.parse(data).token;
    console.log('Token:', token.substring(0, 30) + '...');
    
    const opts = {
      hostname: '127.0.0.1',
      port: 53382,
      path: '/api/applications?page=1&page_size=10',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };
    
    const req2 = http.request(opts, (res2) => {
      let d = '';
      res2.on('data', chunk => d += chunk);
      res2.on('end', () => {
        console.log('Status:', res2.statusCode);
        try {
          const result = JSON.parse(d);
          console.log('应用列表数据:', JSON.stringify(result, null, 2));
        } catch (e) {
          console.log('Raw response:', d);
        }
      });
    });
    req2.on('error', e => console.error('Error:', e));
    req2.end();
  });
});
req.on('error', e => console.error('Error:', e));
req.write(JSON.stringify({ username: 'admin', password: 'admin123' }));
req.end();
