const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 58907,
  path: '/api/health',
  method: 'GET',
  timeout: 3000
};

console.log('Testing backend...');
const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`Response: ${data}`);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Request timed out');
  req.destroy();
  process.exit(1);
});

req.end();
