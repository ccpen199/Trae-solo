const http = require('http');

const API_BASE = 'http://127.0.0.1:60083/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const fullPath = path.startsWith('/') ? path : '/' + path;
    const url = new URL(API_BASE + fullPath);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function main() {
  console.log('=========================================');
  console.log('Business Chain Verification (Node.js)');
  console.log('=========================================\n');

  let token = null;

  // Test 1: Login
  console.log('[1/10] Login');
  const r1 = await request('/auth/login', {
    method: 'POST',
    body: { email: 'designer@example.com', password: '123456' }
  });
  console.log('  Status:', r1.status, 'Code:', r1.data.code, r1.data.message);
  if (r1.data.code !== 200 || !r1.data.data?.token) {
    console.log('  FAIL: Login failed');
    process.exit(1);
  }
  token = r1.data.data.token;
  console.log('  OK: Token obtained');

  const authHeaders = { Authorization: `Bearer ${token}` };

  // Test 2: User info
  console.log('\n[2/10] User info');
  const r2 = await request('/auth/me', { headers: authHeaders });
  console.log('  Status:', r2.status, 'Code:', r2.data.code);
  if (r2.data.code !== 200) { console.log('  FAIL'); process.exit(1); }
  console.log('  OK');

  // Test 3: Cases with 4D filter
  console.log('\n[3/10] Cases list (4D filter)');
  const r3 = await request('/cases?page=1&pageSize=3&layout_type=三居室&style=现代简约&budget_range=10-20万', { headers: authHeaders });
  console.log('  Status:', r3.status, 'Code:', r3.data.code);
  if (r3.data.code !== 200) { console.log('  FAIL'); process.exit(1); }
  console.log('  OK, count:', r3.data.data?.list?.length || 0);

  // Test 4: Case detail
  console.log('\n[4/10] Case detail');
  const r4 = await request('/cases/1', { headers: authHeaders });
  console.log('  Status:', r4.status, 'Code:', r4.data.code);
  if (r4.data.code !== 200) { console.log('  FAIL'); process.exit(1); }
  console.log('  OK');

  // Test 5: AI style migration
  console.log('\n[5/10] AI Style Migration');
  const r5 = await request('/cases/migrate-style', {
    method: 'POST',
    headers: authHeaders,
    body: { case_id: 1, target_styles: ['北欧', '新中式'], area: 120 }
  });
  console.log('  Status:', r5.status, 'Code:', r5.data.code);
  if (r5.data.code !== 200) { console.log('  FAIL'); process.exit(1); }
  console.log('  OK, results:', r5.data.data?.results?.length || 0);

  // Test 6: Quotation
  console.log('\n[6/10] Quotation detail');
  const r6 = await request('/quotations/1', { headers: authHeaders });
  console.log('  Status:', r6.status, 'Code:', r6.data.code);
  if (r6.data.code !== 200) { console.log('  FAIL'); process.exit(1); }
  console.log('  OK');

  // Test 7: Projects
  console.log('\n[7/10] Projects list');
  const r7 = await request('/projects?page=1&pageSize=3', { headers: authHeaders });
  console.log('  Status:', r7.status, 'Code:', r7.data.code);
  if (r7.data.code !== 200) { console.log('  FAIL'); process.exit(1); }
  console.log('  OK, count:', r7.data.data?.list?.length || 0);

  // Test 8: ERP Schedules
  console.log('\n[8/10] ERP Schedules');
  const r8 = await request('/erp/schedules?page=1&pageSize=3', { headers: authHeaders });
  console.log('  Status:', r8.status, 'Code:', r8.data.code);
  if (r8.data.code !== 200) { console.log('  FAIL'); process.exit(1); }
  console.log('  OK, count:', r8.data.data?.list?.length || 0);

  // Test 9: Manager Logs
  console.log('\n[9/10] Construction Logs');
  const r9 = await request('/manager/logs?page=1&pageSize=3', { headers: authHeaders });
  console.log('  Status:', r9.status, 'Code:', r9.data.code);
  if (r9.data.code !== 200) { console.log('  FAIL'); process.exit(1); }
  console.log('  OK, count:', r9.data.data?.list?.length || 0);

  // Test 10: Admin Companies
  console.log('\n[10/10] Admin Companies');
  const r10 = await request('/admin/companies?page=1&pageSize=3', { headers: authHeaders });
  console.log('  Status:', r10.status, 'Code:', r10.data.code);
  if (r10.data.code !== 200) { console.log('  FAIL'); process.exit(1); }
  console.log('  OK, count:', r10.data.data?.list?.length || 0);

  console.log('\n=========================================');
  console.log('[SUCCESS] All 10 business chain tests passed!');
  console.log('=========================================');
}

main().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
