const http = require('http');

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 9171,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('   电子签约系统 - API测试');
  console.log('========================================\n');

  console.log('1. 测试健康检查接口...');
  const healthResult = await makeRequest({
    method: 'GET',
    path: '/health'
  });
  console.log(`   状态码: ${healthResult.statusCode}`);
  console.log(`   响应: ${JSON.stringify(healthResult.data)}\n`);

  console.log('2. 测试登录接口 (admin)...');
  const loginResult = await makeRequest({
    method: 'POST',
    path: '/api/auth/login'
  }, {
    username: 'admin',
    password: 'admin123'
  });
  console.log(`   状态码: ${loginResult.statusCode}`);
  console.log(`   登录成功: ${loginResult.data.success}`);
  if (loginResult.data.success) {
    console.log(`   用户: ${loginResult.data.data.user.realName}`);
    console.log(`   角色: ${loginResult.data.data.user.role}`);
  }
  console.log('');

  const token = loginResult.data.data?.token;

  if (token) {
    console.log('3. 测试获取合同列表...');
    const contractsResult = await makeRequest({
      method: 'GET',
      path: '/api/contracts/list',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`   状态码: ${contractsResult.statusCode}`);
    console.log(`   成功: ${contractsResult.data.success}`);
    console.log(`   合同数量: ${contractsResult.data.data?.contracts?.length || 0}`);
    console.log('');

    console.log('4. 测试法务统计接口...');
    const statsResult = await makeRequest({
      method: 'GET',
      path: '/api/legal/statistics',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`   状态码: ${statsResult.statusCode}`);
    console.log(`   成功: ${statsResult.data.success}`);
    if (statsResult.data.data?.overview) {
      console.log(`   总合同数: ${statsResult.data.data.overview.totalContracts}`);
      console.log(`   总签署数: ${statsResult.data.data.overview.totalSignatures}`);
    }
    console.log('');
  }

  console.log('5. 测试普通用户登录 (initiator)...');
  const loginResult2 = await makeRequest({
    method: 'POST',
    path: '/api/auth/login'
  }, {
    username: 'initiator',
    password: 'admin123'
  });
  console.log(`   状态码: ${loginResult2.statusCode}`);
  console.log(`   登录成功: ${loginResult2.data.success}`);
  if (loginResult2.data.success) {
    console.log(`   用户: ${loginResult2.data.data.user.realName}`);
    console.log(`   角色: ${loginResult2.data.data.user.role}`);
  }
  console.log('');

  console.log('========================================');
  console.log('   API测试完成');
  console.log('========================================');
  console.log('\n访问地址:');
  console.log('   后端API: http://localhost:9171');
  console.log('   前端页面: http://localhost:9172');
  console.log('\n测试账号:');
  console.log('   法务管理员: admin / admin123');
  console.log('   发起方用户: initiator / admin123');
  console.log('   签署方用户: signer / admin123');
}

runTests().catch(console.error);
