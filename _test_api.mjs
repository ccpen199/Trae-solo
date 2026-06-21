import http from 'http';

function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': body.length
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
        try { resolve(JSON.parse(d)); } catch(e) { resolve(d); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    http.get({ hostname: 'localhost', port: 3002, path, headers }, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { resolve(d); }
      });
    }).on('error', reject);
  });
}

(async () => {
  console.log('=== API 测试开始 ===\n');

  const login = await post('/api/auth/login', { phone: '138****8888' });
  console.log(' 1. POST /api/auth/login              =>', login.success ? 'OK' : 'FAIL');
  const token = login.token;

  const tests = [
    ['GET  /api/auth/userinfo', '/api/auth/userinfo'],
    ['GET  /api/social/account', '/api/social/account'],
    ['GET  /api/social/records', '/api/social/records'],
    ['GET  /api/social/export', '/api/social/export'],
    ['GET  /api/household/list', '/api/household/list'],
    ['GET  /api/health/code', '/api/health/code'],
    ['GET  /api/health/refresh', '/api/health/refresh'],
    ['GET  /api/certificates', '/api/certificates'],
    ['GET  /api/audit/logs', '/api/audit/logs'],
    ['GET  /api/transport/qr', '/api/transport/qr'],
    ['GET  /api/transport/records', '/api/transport/records'],
    ['GET  /api/education/schools', '/api/education/schools'],
    ['GET  /api/education/districts', '/api/education/districts'],
    ['GET  /api/recommend/services', '/api/recommend/services'],
  ];

  for (let i = 0; i < tests.length; i++) {
    const [label, path] = tests[i];
    const res = await get(path, token);
    const ok = res && res.success;
    console.log((i + 2).toString().padStart(2) + '. ' + label.padEnd(38) + ' => ' + (ok ? 'OK' : 'FAIL: ' + (res?.error || 'unknown')));
  }

  const postTests = [
    ['POST /api/household/submit', '/api/household/submit', { type: 'newborn', title: '新生儿入户' }],
    ['POST /api/household/ocr', '/api/household/ocr', { materialType: 'idcard' }],
    ['POST /api/audit/log', '/api/audit/log', { action: 'test', module: 'test' }],
    ['POST /api/education/enroll', '/api/education/enroll', { childName: '张小明', childIdCard: '110101202001011234', schoolId: 'sch-001' }],
    ['POST /api/auth/logout', '/api/auth/logout', {}],
  ];

  let idx = tests.length + 2;
  for (const [label, path, data] of postTests) {
    const useToken = label !== 'POST /api/auth/logout';
    const res = await post(path, data, useToken ? token : null);
    const ok = res && res.success;
    console.log(idx.toString().padStart(2) + '. ' + label.padEnd(38) + ' => ' + (ok ? 'OK' : 'FAIL: ' + (res?.error || 'unknown')));
    idx++;
  }

  const certs = await get('/api/certificates', token);
  if (certs.success && certs.data && certs.data[0]) {
    const certId = certs.data[0].id;
    const bizs = await get('/api/household/list', token);
    const bizId = bizs.data && bizs.data[0]?.id;
    
    const verifyRes = await get(`/api/certificates/${certId}/verify`, token);
    console.log(idx.toString().padStart(2) + '. GET  /api/certificates/:id/verify     => ' + (verifyRes.success ? 'OK' : 'FAIL'));
    idx++;
    
    if (bizId) {
      const bizRes = await get(`/api/household/${bizId}`, token);
      console.log(idx.toString().padStart(2) + '. GET  /api/household/:id               => ' + (bizRes.success ? 'OK' : 'FAIL'));
    }
  }

  console.log('\n=== API 测试结束 ===');
})();
