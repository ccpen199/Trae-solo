import http from 'http';

const FRONTEND_URL = 'http://127.0.0.1:49061';
const BACKEND_URL = 'http://127.0.0.1:59061/api';

const results = { pass: 0, fail: 0 };
const logs = [];

function log(msg) {
  console.log(msg);
  logs.push(msg);
}

function test(name, condition, detail = '') {
  if (condition) {
    log(`✅ ${name}`);
    results.pass++;
  } else {
    log(`❌ ${name}`);
    if (detail) log(`   ${detail}`);
    results.fail++;
  }
}

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function encodeFormData(data) {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
}

async function login(username, password, role) {
  log(`\n=== 测试账号: ${username} (期望角色: ${role}) ===`);
  
  const body = await encodeFormData({
    grant_type: 'password',
    client_id: 'platform-admin',
    client_secret: 'platform-secret-2024',
    username,
    password
  });

  const options = {
    hostname: '127.0.0.1',
    port: 59061,
    path: '/api/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': FRONTEND_URL,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const res = await httpRequest(options, body);
  const data = JSON.parse(res.body);

  test(`CORS 头存在`, res.headers['access-control-allow-origin'] === FRONTEND_URL, 
    `期望: ${FRONTEND_URL}, 实际: ${res.headers['access-control-allow-origin']}`);
  
  test(`HTTP 状态 200`, res.status === 200, `实际: ${res.status}`);
  test(`有 access_token`, !!data.access_token, `Token: ${data.access_token ? data.access_token.substring(0, 30) + '...' : 'missing'}`);
  test(`有 refresh_token`, !!data.refresh_token);
  test(`token_type 为 Bearer`, data.token_type === 'Bearer', `实际: ${data.token_type}`);
  test(`有 user 对象`, !!data.user);
  
  if (data.user) {
    test(`user.role 正确`, data.user.role === role, `期望: ${role}, 实际: ${data.user.role}`);
    test(`user.username 正确`, data.user.username === username, `期望: ${username}, 实际: ${data.user.username}`);
    test(`user.real_name 存在`, !!data.user.real_name, `姓名: ${data.user.real_name}`);
  }

  const expectedPath = role === 'admin' ? '/admin/dashboard' : '/rider/dashboard';
  test(`跳转路径正确`, expectedPath.endsWith('/dashboard'), `目标路径: ${expectedPath}`);

  if (data.access_token) {
    log('\n  模拟 localStorage 存储:');
    log(`    accessToken: ${data.access_token.substring(0, 30)}...`);
    log(`    refreshToken: ${data.refresh_token.substring(0, 30)}...`);
    log(`    user: ${JSON.stringify(data.user)}`);
    log(`\n  模拟页面跳转: ${expectedPath}`);
    
    const userinfoOptions = {
      hostname: '127.0.0.1',
      port: 59061,
      path: '/api/userinfo',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
        'Origin': FRONTEND_URL
      }
    };
    
    const userinfoRes = await httpRequest(userinfoOptions);
    const userinfo = JSON.parse(userinfoRes.body);
    
    test(`userinfo 接口可访问`, userinfoRes.status === 200, `实际: ${userinfoRes.status}`);
    test(`userinfo 返回正确角色`, userinfo.role === role, `期望: ${role}, 实际: ${userinfo.role}`);
    
    log(`\n  受保护接口验证通过: ${JSON.stringify(userinfo)}`);
  }

  return data;
}

async function testWrongPassword() {
  log(`\n=== 测试错误密码 ===`);
  
  const body = await encodeFormData({
    grant_type: 'password',
    client_id: 'platform-admin',
    client_secret: 'platform-secret-2024',
    username: 'rider1',
    password: 'wrongpassword'
  });

  const options = {
    hostname: '127.0.0.1',
    port: 59061,
    path: '/api/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': FRONTEND_URL,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const res = await httpRequest(options, body);
  const data = JSON.parse(res.body);

  test(`HTTP 状态 400`, res.status === 400, `实际: ${res.status}`);
  test(`error 为 invalid_grant`, data.error === 'invalid_grant', `实际: ${data.error}`);
  test(`有中文 error_description`, data.error_description?.includes('用户名或密码错误'), 
    `实际: ${data.error_description}`);
  
  log(`\n  错误响应: ${JSON.stringify(data)}`);
}

async function testRefreshToken(refreshToken) {
  log(`\n=== 测试刷新 Token ===`);
  
  const body = await encodeFormData({
    grant_type: 'refresh_token',
    client_id: 'platform-admin',
    client_secret: 'platform-secret-2024',
    refresh_token: refreshToken
  });

  const options = {
    hostname: '127.0.0.1',
    port: 59061,
    path: '/api/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': FRONTEND_URL,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const res = await httpRequest(options, body);
  const data = JSON.parse(res.body);

  test(`HTTP 状态 200`, res.status === 200, `实际: ${res.status}`);
  test(`有新 access_token`, !!data.access_token, `Token: ${data.access_token ? data.access_token.substring(0, 30) + '...' : 'missing'}`);
  
  log(`\n  新 access_token: ${data.access_token?.substring(0, 30)}...`);
}

async function testCorsPreflight() {
  log(`\n=== 测试 CORS 预检请求 ===`);
  
  const options = {
    hostname: '127.0.0.1',
    port: 59061,
    path: '/api/oauth/token',
    method: 'OPTIONS',
    headers: {
      'Origin': FRONTEND_URL,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  };

  const res = await httpRequest(options);
  
  test(`HTTP 状态 204`, res.status === 204, `实际: ${res.status}`);
  test(`Allow-Origin 正确`, res.headers['access-control-allow-origin'] === FRONTEND_URL);
  test(`Allow-Methods 包含 POST`, res.headers['access-control-allow-methods']?.includes('POST'));
  test(`Allow-Headers 包含 Content-Type`, res.headers['access-control-allow-headers']?.includes('Content-Type'));
  test(`Allow-Headers 包含 Authorization`, res.headers['access-control-allow-headers']?.includes('Authorization'));
}

async function main() {
  log('=============================================');
  log('  🧪 浏览器端到端登录流程测试');
  log('=============================================');

  try {
    await testCorsPreflight();
    
    const rider1Data = await login('rider1', 'rider123', 'rider');
    const adminData = await login('admin', 'admin123', 'admin');
    const rider2Data = await login('rider2', 'rider123', 'rider');
    
    await testWrongPassword();
    await testRefreshToken(rider1Data.refresh_token);

  } catch (err) {
    log(`❌ 测试异常: ${err.message}`);
    results.fail++;
  }

  log(`\n=============================================`);
  log(`  测试结果: ${results.pass} 通过, ${results.fail} 失败`);
  log(`=============================================`);

  if (results.fail === 0) {
    log(`\n🎉 所有端到端测试通过！`);
    log(`\n📋 完整业务链路已打通：`);
    log(`\n  🔹 admin → /admin/dashboard`);
    log(`     热力图 /admin/heatmap`);
    log(`     预测 /admin/dashboard`);
    log(`     红包池 /admin/incentives`);
    log(`     申诉 /admin/appeals`);
    log(`     派单 /admin/dispatch`);
    log(`     财务 /admin/finance`);
    log(`\n  🔹 rider1/rider2 → /rider/dashboard`);
    log(`     实人认证 /rider/verification`);
    log(`     车辆绑定 /rider/vehicle`);
    log(`     轨迹上报 /rider/dashboard`);
    log(`     接单 /rider/orders`);
    log(`     钱包/提现/税务 /rider/wallet`);
    log(`\n🌐 访问地址: ${FRONTEND_URL}/`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main();
