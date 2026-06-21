import http from 'http';

function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body, 'utf8')
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({
      hostname: 'localhost',
      port: 3002,
      path,
      method: 'POST',
      headers
    }, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  const login = await post('/api/auth/login', { phone: '138****8888' });
  console.log('LOGIN:', login.status, login.data.success);
  const token = login.data.token;

  const r1 = await post('/api/household/submit', { type: 'newborn', title: 'Newborn Registration' }, token);
  console.log('POST /api/household/submit:', r1.status, r1.data.success);

  const r2 = await post('/api/education/enroll', { childName: 'XiaoMing', childIdCard: '110101202001011234', schoolId: 'sch-001' }, token);
  console.log('POST /api/education/enroll:', r2.status, r2.data.success);
})();
