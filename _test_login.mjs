import http from 'http';

function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
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
          try {
            resolve({ status: res.statusCode, data: JSON.parse(d) });
          } catch {
            resolve({ status: res.statusCode, data: d });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function test() {
  console.log('=== Test 1: Send code ===');
  const r1 = await post('/api/auth/send-code', { phone: '13800138000' });
  console.log('Status:', r1.status, 'Data:', JSON.stringify(r1.data, null, 2));

  console.log('\n=== Test 2: Login correct code ===');
  const r2 = await post('/api/auth/login', { phone: '13800138000', verifyCode: '123456' });
  console.log('Status:', r2.status, 'Data:', JSON.stringify(r2.data, null, 2));

  console.log('\n=== Test 3: Send code again ===');
  const r3 = await post('/api/auth/send-code', { phone: '13800138000' });
  console.log('Status:', r3.status);

  console.log('\n=== Test 4: Login wrong code ===');
  const r4 = await post('/api/auth/login', { phone: '13800138000', verifyCode: '000000' });
  console.log('Status:', r4.status, 'Data:', JSON.stringify(r4.data, null, 2));

  console.log('\n=== Test 5: Invalid phone format ===');
  const r5 = await post('/api/auth/send-code', { phone: '12345' });
  console.log('Status:', r5.status, 'Data:', JSON.stringify(r5.data, null, 2));

  console.log('\n=== Test 6: ID card login ===');
  const r6 = await post('/api/auth/login', { idCard: '110101199001011234', realName: '张三' });
  console.log('Status:', r6.status, 'Data:', JSON.stringify(r6.data, null, 2));
}

test().catch(console.error);
