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
    
    const opts = {
      hostname: '127.0.0.1',
      port: 53382,
      path: '/api/tasks/1',
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
        const result = JSON.parse(d);
        console.log('状态:', result.status);
        console.log('日志数:', result.logs.length);
        console.log('统计:', result.stats);
        if (result.logs.length > 0) {
          console.log('第一条日志:', result.logs[0].status_code, result.logs[0].response_time + 'ms');
        }
      });
    });
    req2.end();
  });
});

req.write(JSON.stringify({ username: 'admin', password: 'admin123' }));
req.end();
