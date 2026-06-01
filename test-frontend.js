const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 48907,
  path: '/',
  method: 'GET',
  timeout: 5000
};

console.log('Testing frontend...');
const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`Response length: ${data.length} bytes`);
    console.log(`First 200 chars: ${data.substring(0, 200)}`);
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
