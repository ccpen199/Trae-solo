const http = require('http');

const API_HOST = '127.0.0.1';
const API_PORT = 53382;
const DEMO_PORT = 54383;

let globalToken = '';
let testResults = [];

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: '/api' + path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function recordTest(name, passed, detail = '') {
  testResults.push({ name, passed, detail });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${status} - ${name}`);
  if (detail && !passed) console.log(`     ${detail}`);
}

async function runTestSuite() {
  console.log('='.repeat(60));
  console.log('   API 压测系统 - 完整接口测试套件');
  console.log('='.repeat(60));
  console.log(`测试目标: http://${API_HOST}:${API_PORT}/api`);
  console.log('');

  try {
    // ===== 1. 认证模块 =====
    console.log('\n[1/8] 认证模块测试');
    console.log('-'.repeat(40));
    
    const loginRes = await request('POST', '/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    globalToken = loginRes.body.token;
    recordTest('用户登录', loginRes.status === 200 && globalToken);
    
    const meRes = await request('GET', '/auth/me', null, globalToken);
    recordTest('获取当前用户', meRes.status === 200 && meRes.body.username);
    
    const badLoginRes = await request('POST', '/auth/login', {
      username: 'admin',
      password: 'wrong'
    });
    recordTest('错误密码拒绝', badLoginRes.status === 401);

    // ===== 2. 用户管理模块 =====
    console.log('\n[2/8] 用户管理模块测试');
    console.log('-'.repeat(40));
    
    const usersRes = await request('GET', '/users?page_size=100', null, globalToken);
    recordTest('获取用户列表', usersRes.status === 200 && Array.isArray(usersRes.body.data));
    recordTest('用户数>=5', usersRes.body.data && usersRes.body.data.length >= 5);

    // ===== 3. 应用管理模块 =====
    console.log('\n[3/8] 应用管理模块测试');
    console.log('-'.repeat(40));
    
    const appListRes = await request('GET', '/applications?page=1&page_size=10', null, globalToken);
    recordTest('获取应用列表', appListRes.status === 200);
    
    const createAppRes = await request('POST', '/applications', {
      name: '接口测试应用-' + Date.now(),
      description: '自动化测试创建的应用',
      owner_id: 1,
      status: 'active'
    }, globalToken);
    const testAppId = createAppRes.body.id;
    recordTest('创建应用', createAppRes.status === 201);
    
    const appDetailRes = await request('GET', `/applications/${testAppId}`, null, globalToken);
    recordTest('获取应用详情', appDetailRes.status === 200);
    
    const updateAppRes = await request('PUT', `/applications/${testAppId}`, {
      name: '接口测试应用-已更新',
      description: '已更新描述'
    }, globalToken);
    recordTest('更新应用', updateAppRes.status === 200);

    // ===== 4. 环境管理模块 =====
    console.log('\n[4/8] 环境管理模块测试');
    console.log('-'.repeat(40));
    
    const createEnvRes = await request('POST', '/environments', {
      app_id: testAppId,
      name: '测试环境-' + Date.now(),
      type: 'test',
      base_url: `http://${API_HOST}:${API_PORT}`
    }, globalToken);
    const testEnvId = createEnvRes.body.id;
    recordTest('创建环境', createEnvRes.status === 201);
    
    const envListRes = await request('GET', `/environments?app_id=${testAppId}`, null, globalToken);
    recordTest('获取环境列表', envListRes.status === 200);
    
    const createKeyRes = await request('POST', `/environments/${testEnvId}/keys`, {
      name: '测试密钥',
      permissions: ['read', 'write']
    }, globalToken);
    recordTest('创建API密钥', createKeyRes.status === 201);

    // ===== 5. 压测任务模块 =====
    console.log('\n[5/8] 压测任务模块测试');
    console.log('-'.repeat(40));
    
    const createTaskRes = await request('POST', '/tasks', {
      app_id: testAppId,
      env_id: testEnvId,
      name: '自测试-健康检查',
      description: '压测系统测试自身API',
      api_endpoint: '/api/health',
      method: 'GET',
      concurrency: 5,
      requests: 50
    }, globalToken);
    const testTaskId = createTaskRes.body.id;
    recordTest('创建压测任务', createTaskRes.status === 201);
    
    const taskListRes = await request('GET', '/tasks?page=1&page_size=10', null, globalToken);
    recordTest('获取任务列表', taskListRes.status === 200);
    
    const execTaskRes = await request('POST', `/tasks/${testTaskId}/execute`, {}, globalToken);
    recordTest('执行压测任务', execTaskRes.status === 200);
    
    console.log('  ⏳  等待压测执行...');
    await new Promise(r => setTimeout(r, 10000));
    
    const taskDetailRes = await request('GET', `/tasks/${testTaskId}`, null, globalToken);
    recordTest('任务执行完成', taskDetailRes.body.status === 'completed');
    recordTest('产生调用日志', taskDetailRes.body.logs && taskDetailRes.body.logs.length > 0);
    
    const logsRes = await request('GET', `/tasks/${testTaskId}/logs?page=1&page_size=100`, null, globalToken);
    recordTest('获取调用日志', logsRes.status === 200);

    // ===== 6. 变更单模块 =====
    console.log('\n[6/8] 变更单模块测试');
    console.log('-'.repeat(40));
    
    const createOrderRes = await request('POST', '/change-orders', {
      type: 'config',
      title: '接口测试变更单',
      description: '自动化测试变更',
      app_id: testAppId,
      reason: '测试变更流程',
      content: '测试内容'
    }, globalToken);
    const testOrderId = createOrderRes.body.id;
    recordTest('创建变更单', createOrderRes.status === 201);
    
    const submitRes = await request('POST', `/change-orders/${testOrderId}/submit`, { reason: '提交审批' }, globalToken);
    recordTest('提交变更单', submitRes.status === 200);
    
    const approveRes = await request('POST', `/change-orders/${testOrderId}/approve`, { comment: '批准' }, globalToken);
    recordTest('批准变更单', approveRes.status === 200);
    
    const orderListRes = await request('GET', '/change-orders?page=1&page_size=10', null, globalToken);
    recordTest('获取变更单列表', orderListRes.status === 200);

    // ===== 7. 告警模块 =====
    console.log('\n[7/8] 告警模块测试');
    console.log('-'.repeat(40));
    
    const alertsRes = await request('GET', '/alerts?page=1&page_size=20', null, globalToken);
    recordTest('获取告警列表', alertsRes.status === 200);
    
    const workbenchRes = await request('GET', '/alerts/workbench/summary', null, globalToken);
    recordTest('工作台汇总数据', workbenchRes.status === 200);

    // ===== 8. 审计模块 =====
    console.log('\n[8/8] 审计模块测试');
    console.log('-'.repeat(40));
    
    const auditRes = await request('GET', '/audit?page=1&page_size=20', null, globalToken);
    recordTest('获取审计日志', auditRes.status === 200);
    recordTest('审计记录存在', auditRes.body.data && auditRes.body.data.length > 0);

    // ===== 压测系统自身API压测 =====
    console.log('\n' + '='.repeat(60));
    console.log('   压测系统自身API - 压力测试');
    console.log('='.repeat(60));
    
    const stressTasks = [
      { endpoint: '/api/health', name: '健康检查接口', method: 'GET' },
      { endpoint: '/api/applications', name: '应用列表接口', method: 'GET' },
      { endpoint: '/api/users', name: '用户列表接口', method: 'GET' },
      { endpoint: '/api/alerts', name: '告警列表接口', method: 'GET' },
      { endpoint: '/api/audit', name: '审计日志接口', method: 'GET' }
    ];
    
    for (const st of stressTasks) {
      console.log(`\n压测: ${st.name}`);
      const stressRes = await request('POST', '/tasks', {
        app_id: testAppId,
        env_id: testEnvId,
        name: `自压测-${st.name}`,
        api_endpoint: st.endpoint,
        method: st.method,
        concurrency: 3,
        requests: 30
      }, globalToken);
      
      if (stressRes.status === 201) {
        await request('POST', `/tasks/${stressRes.body.id}/execute`, {}, globalToken);
        console.log(`  ✅ 已启动 (30次请求, 并发3)`);
      }
    }
    
    console.log('\n  ⏳  等待所有压测任务完成 (15秒)...');
    await new Promise(r => setTimeout(r, 15000));

    // ===== 测试结果汇总 =====
    console.log('\n' + '='.repeat(60));
    console.log('   测试结果汇总');
    console.log('='.repeat(60));
    
    const passed = testResults.filter(t => t.passed).length;
    const total = testResults.length;
    console.log(`\n总测试用例: ${total}`);
    console.log(`通过: ${passed} / ${total} (${((passed/total)*100).toFixed(1)}%)`);
    console.log(`失败: ${total - passed}`);
    
    console.log('\n失败详情:');
    testResults.filter(t => !t.passed).forEach(t => {
      console.log(`  ❌ ${t.name}`);
      if (t.detail) console.log(`     ${t.detail}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('   测试完成！前端访问: http://127.0.0.1:43382');
    console.log('='.repeat(60));

  } catch (e) {
    console.error('\n❌ 测试执行失败:', e.message);
    console.error(e.stack);
  }
}

runTestSuite();
