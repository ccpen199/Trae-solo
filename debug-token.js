const http = require('http');

function testApi(method, path, token = null, body = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: '127.0.0.1',
      port: 59077,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, code: json.code, data: json.data, raw: data });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ status: 0, error: e.message });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  console.log('=== Debug Token Test ===\n');

  let r = await testApi('POST', '/auth/login', null, {
    idCard: 'admin',
    password: 'admin123',
  });
  
  console.log('Login response status:', r.status);
  console.log('Login response:', JSON.stringify(r.data, null, 2));
  
  const adminToken = r.data?.token;
  console.log('\nAdmin token:', adminToken ? 'Got token' : 'No token');
  
  if (adminToken) {
    console.log('Token (first 50 chars):', adminToken.substring(0, 50) + '...');
  }

  console.log('\n--- Testing admin API with token ---');
  r = await testApi('GET', '/admin/dashboard', adminToken);
  console.log('Admin dashboard status:', r.status);
  console.log('Admin dashboard code:', r.code);
  console.log('Admin dashboard response:', r.raw);
}

main();
