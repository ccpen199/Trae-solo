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
          resolve({ status: res.statusCode, code: json.code, data: json.data });
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
  console.log('========== API 验收测试 ==========\n');

  console.log('1. 健康检查');
  let r = await testApi('GET', '/health');
  console.log(`   ${r.status === 200 && r.code === 200 ? '✅' : '❌'} 健康接口: status=${r.status}, code=${r.code}`);
  console.log(`   服务名: ${r.data?.service}, 端口: ${r.data?.port}`);

  console.log('\n2. 用户登录');
  r = await testApi('POST', '/auth/login', null, {
    idCard: '530102199001011234',
    password: 'password123',
  });
  const userToken = r.data?.token;
  console.log(`   ${r.status === 200 && userToken ? '✅' : '❌'} 个人用户登录: status=${r.status}`);
  console.log(`   用户: ${r.data?.user?.name}, 角色: ${r.data?.user?.role}`);

  console.log('\n3. 管理员登录');
  r = await testApi('POST', '/auth/login', null, {
    idCard: 'admin',
    password: 'admin123',
  });
  const adminToken = r.data?.token;
  console.log(`   ${r.status === 200 && adminToken ? '✅' : '❌'} 管理员登录: status=${r.status}`);
  console.log(`   用户: ${r.data?.user?.name}, 角色: ${r.data?.user?.role}`);

  console.log('\n4. 个人业务API');
  let userToken2 = userToken;
  const userApis = [
    ['/insurance/summary', '五险总览'],
    ['/contract', '劳动合同'],
    ['/certification', '认证记录'],
    ['/rights', '维权案件'],
    ['/jobs/match', '岗位匹配'],
  ];
  for (const [path, name] of userApis) {
    r = await testApi('GET', path, userToken2);
    const ok = r.status === 200 && r.code === 200;
    console.log(`   ${ok ? '✅' : '❌'} ${name}: status=${r.status}, code=${r.code}`);
  }

  console.log('\n5. 公开API');
  const publicApis = [
    ['/jobs', '岗位列表'],
    ['/institutions', '机构列表'],
    ['/institutions/nearby', '附近机构'],
    ['/policies', '政策列表'],
    ['/policies/recommend', '推荐政策'],
    ['/consult/qa', '咨询问答'],
  ];
  for (const [path, name] of publicApis) {
    r = await testApi('GET', path);
    const ok = r.status === 200 && r.code === 200;
    console.log(`   ${ok ? '✅' : '❌'} ${name}: status=${r.status}, code=${r.code}`);
  }

  console.log('\n6. 管理后台API');
  let adminToken2 = adminToken;
  const adminApis = [
    ['/admin/dashboard', '运营总览'],
    ['/admin/supervise', '督办中心'],
    ['/admin/knowledge/graph', '知识图谱'],
    ['/admin/knowledge/cluster', '语义聚类'],
    ['/admin/city', '地市接入'],
    ['/admin/security/audit', '安全审计'],
    ['/admin/security/logs', '审计日志'],
    ['/admin/statistics/overview', '数据统计'],
  ];
  for (const [path, name] of adminApis) {
    r = await testApi('GET', path, adminToken2);
    const ok = r.status === 200 && r.code === 200;
    console.log(`   ${ok ? '✅' : '❌'} ${name}: status=${r.status}, code=${r.code}`);
  }

  console.log('\n7. 核心业务验证');
  console.log('   - 五险数据:');
  r = await testApi('GET', '/insurance/summary', userToken2);
  console.log(`     ✅ 总缴费月数: ${r.data?.totalPaymentMonths} 个月`);
  console.log(`     ✅ 账户权益余额: ¥${Number(r.data?.totalAccountBalance || 0).toLocaleString()}`);
  console.log(`     ✅ 养老保险缴费: ${r.data?.pension?.paymentMonths} 个月`);
  console.log(`     ✅ 医疗保险缴费: ${r.data?.medical?.paymentMonths} 个月`);

  console.log('\n   - 劳动合同:');
  r = await testApi('GET', '/contract', userToken2);
  console.log(`     ✅ 合同数量: ${r.data?.length} 份`);

  console.log('\n   - 管理统计:');
  r = await testApi('GET', '/admin/dashboard', adminToken2);
  const stats = r.data?.stats || {};
  Object.entries(stats).forEach(([k, v]) => {
    console.log(`     ✅ ${k}: ${v}`);
  });

  console.log('\n========== 测试完成 ==========');
}

main().catch(console.error);
