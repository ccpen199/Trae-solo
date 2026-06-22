import http from 'http';

function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5173,
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
          try { resolve({ status: res.statusCode, url: path, data: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode, url: path, data: d }); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5173,
        path,
        method: 'GET',
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, url: path, data: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode, url: path, data: d }); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  let token = null;

  console.log('\n========== 1. 发送验证码 ==========');
  const r1 = await post('/api/auth/send-code', { phone: '13800138000' });
  console.log('Status:', r1.status, '✓', r1.data.success ? '成功' : '失败');
  if (!r1.data.success) console.log('  Error:', r1.data.error);

  console.log('\n========== 2. 手机号登录 ==========');
  const r2 = await post('/api/auth/login', { phone: '13800138000', verifyCode: '123456' });
  console.log('Status:', r2.status, '✓', r2.data.success ? '成功' : '失败');
  console.log('  返回键:', Object.keys(r2.data).join(', '));
  if (r2.data.success) {
    token = r2.data.token;
    console.log('  Token存在:', !!token);
    console.log('  User.name:', r2.data.user?.name);
    console.log('  User.elderlyMode:', r2.data.user?.elderlyMode);
    console.log('  User.fontScale:', r2.data.user?.fontScale);
    console.log('  User.voiceNav:', r2.data.user?.voiceNav);
    console.log('  User.relatives:', r2.data.user?.relatives?.length, '人');
  } else {
    console.log('  Error:', r2.data.error);
  }

  console.log('\n========== 3. 错误验证码 ==========');
  const r3 = await post('/api/auth/login', { phone: '13800138000', verifyCode: '000000' });
  console.log('Status:', r3.status, '✓', !r3.data.success ? '正确拦截' : '异常');
  console.log('  错误提示:', r3.data.error);

  console.log('\n========== 4. 身份证登录 ==========');
  const r4 = await post('/api/auth/login', { idCard: '110101199001011234', realName: '张三' });
  console.log('Status:', r4.status, '✓', r4.data.success ? '成功' : '失败');
  if (r4.data.success) {
    token = r4.data.token;
  } else {
    console.log('  Error:', r4.data.error);
  }

  console.log('\n========== 5. 推荐服务 ==========');
  const r5 = await get('/api/recommend/services');
  console.log('Status:', r5.status);
  console.log('  顶层键:', Object.keys(r5.data).join(', '));
  const svcs = r5.data.data || r5.data;
  console.log('  数量:', Array.isArray(svcs) ? svcs.length : '非数组');
  if (Array.isArray(svcs) && svcs[0]) {
    console.log('  第1条:', JSON.stringify(svcs[0]).slice(0, 80));
  }

  console.log('\n========== 6. 社保账户 ==========');
  const r6 = await get('/api/social/account');
  console.log('Status:', r6.status);
  console.log('  顶层键:', Object.keys(r6.data).join(', '));

  console.log('\n========== 7. 社保缴费记录 ==========');
  const r7 = await get('/api/social/records');
  console.log('Status:', r7.status);
  const recs = r7.data.data || r7.data;
  console.log('  数量:', Array.isArray(recs) ? recs.length : '非数组');

  console.log('\n========== 8. 户籍业务列表 ==========');
  const r8 = await get('/api/household/list');
  console.log('Status:', r8.status);
  const biz = r8.data.data || r8.data;
  console.log('  数量:', Array.isArray(biz) ? biz.length : '非数组');
  if (Array.isArray(biz) && biz[0]) {
    console.log('  第1条:', biz[0].title, '| 状态:', biz[0].status);
  }

  console.log('\n========== 9. 乘车码 ==========');
  const r9 = await get('/api/transport/qr');
  console.log('Status:', r9.status);
  console.log('  顶层键:', Object.keys(r9.data).join(', '));

  console.log('\n========== 10. 电子证照 ==========');
  const r10 = await get('/api/certificates');
  console.log('Status:', r10.status);
  const certs = r10.data.data || r10.data;
  console.log('  数量:', Array.isArray(certs) ? certs.length : '非数组');

  console.log('\n========== 11. 健康码 ==========');
  const r11 = await get('/api/health/code');
  console.log('Status:', r11.status);
  console.log('  顶层键:', Object.keys(r11.data).join(', '));

  console.log('\n========== 12. 审计日志 ==========');
  const r12 = await get('/api/audit/logs');
  console.log('Status:', r12.status);
  const logs = r12.data.data || r12.data;
  console.log('  数量:', Array.isArray(logs) ? logs.length : '非数组');

  console.log('\n========== 13. 学校 ==========');
  const r13 = await get('/api/education/schools');
  console.log('Status:', r13.status);
  const schools = r13.data.data || r13.data;
  console.log('  数量:', Array.isArray(schools) ? schools.length : '非数组');

  console.log('\n✅ 全部测试完成');
}

test().catch(console.error);
