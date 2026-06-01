const http = require('http');
const fs = require('fs');

function makeRequest(method, host, port, path, body) {
  return new Promise((resolve, reject) => {
    const options = { hostname: host, port: port, path: path, method: method, headers: { 'Content-Type': 'application/json' }, timeout: 10000 };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function verify() {
  const lines = [];
  try {
    const fe = await makeRequest('GET', '127.0.0.1', 46935, '/', null);
    lines.push('Frontend HTTP ' + fe.status);
    
    const be = await makeRequest('GET', '127.0.0.1', 56935, '/api/health', null);
    lines.push('Backend Health ' + be.status + ' ' + be.body);
    
    const login = await makeRequest('POST', '127.0.0.1', 46935, '/api/auth/login', { phone: '13800138001', password: '123456' });
    lines.push('Login via proxy ' + login.status + ' ' + login.body.substring(0, 100));
    
    const driverLogin = await makeRequest('POST', '127.0.0.1', 46935, '/api/auth/login', { phone: '13800138002', password: '123456' });
    lines.push('Driver login via proxy ' + driverLogin.status + ' ' + driverLogin.body.substring(0, 100));
    
    const adminLogin = await makeRequest('POST', '127.0.0.1', 46935, '/api/auth/login', { phone: '13800138003', password: '123456' });
    lines.push('Admin login via proxy ' + adminLogin.status + ' ' + adminLogin.body.substring(0, 100));
  } catch (e) {
    lines.push('ERROR: ' + e.message);
  }
  fs.writeFileSync('/Users/chen/Documents/trae_projects/local_projects/may-86935/verify_result.txt', lines.join('\n'));
}

verify();
