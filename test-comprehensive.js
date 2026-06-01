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
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } 
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function recordTest(name, passed, detail = '') {
  testResults.push({ name, passed, detail });
  console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'} - ${name}`);
  if (detail && !passed) console.log(`     ${detail}`);
}

async function runTest() {
  console.log('='.repeat(70));
  console.log('   API 压测系统 - 压测引擎专项测试');
  console.log('='.repeat(70));
  console.log('');

  try {
    // 1. 登录获取 Token
    const loginRes = await request('POST', '/auth/login', {
      username: 'admin', password: 'admin123'
    });
    globalToken = loginRes.body.token;

    // 2. 创建测试应用和环境（目标指向 Demo API 服务）
    console.log('\n[1/5] 准备测试环境');
    console.log('-'.repeat(50));
    
    const appRes = await request('POST', '/applications', {
      name: '压测验证应用-' + Date.now(),
      description: '用于验证压测功能的专用应用',
      owner_id: 1, status: 'active'
    }, globalToken);
    const appId = appRes.body.id;
    recordTest('创建测试应用', appRes.status === 201);

    const envRes = await request('POST', '/environments', {
      app_id: appId,
      name: 'Demo API环境',
      type: 'test',
      base_url: `http://${API_HOST}:${DEMO_PORT}`
    }, globalToken);
    const envId = envRes.body.id;
    recordTest('创建测试环境(Demo API)', envRes.status === 201);

    // ===== 3. Demo API 压测测试 =====
    console.log('\n[2/5] Demo API 压测 - 各种接口场景');
    console.log('-'.repeat(50));

    const stressScenarios = [
      { name: '健康检查接口', endpoint: '/api/health', method: 'GET', concurrency: 5, requests: 50 },
      { name: '用户列表接口', endpoint: '/api/users', method: 'GET', concurrency: 5, requests: 50 },
      { name: '慢响应接口', endpoint: '/api/slow', method: 'GET', concurrency: 3, requests: 20 },
      { name: '随机错误接口', endpoint: '/api/error', method: 'GET', concurrency: 3, requests: 30 }
    ];

    const taskIds = [];
    for (const scenario of stressScenarios) {
      const taskRes = await request('POST', '/tasks', {
        app_id: appId, env_id: envId,
        name: `压测-${scenario.name}`,
        api_endpoint: scenario.endpoint,
        method: scenario.method,
        concurrency: scenario.concurrency,
        requests: scenario.requests
      }, globalToken);
      
      if (taskRes.status === 201) {
        taskIds.push({ id: taskRes.body.id, name: scenario.name, ...scenario });
        await request('POST', `/tasks/${taskRes.body.id}/execute`, {}, globalToken);
        console.log(`  ✅ 启动: ${scenario.name} (${scenario.requests}次, 并发${scenario.concurrency})`);
      }
    }

    console.log('\n  ⏳  等待所有压测任务完成 (20秒)...');
    await new Promise(r => setTimeout(r, 20000));

    // 验证每个压测结果
    console.log('\n  验证压测结果:');
    for (const task of taskIds) {
      const resultRes = await request('GET', `/tasks/${task.id}`, null, globalToken);
      const r = resultRes.body;
      const successRate = ((r.stats?.success_count || 0) / task.requests) * 100;
      
      const passed = r.status === 'completed' && (r.stats?.total_requests || 0) > 0;
      recordTest(`${task.name} - 完成状态`, passed);
      console.log(`     统计: ${r.stats?.success_count||0}/${r.stats?.total_requests||0} 成功, ` +
                  `平均${Math.round(r.stats?.avg_response_time||0)}ms, ` +
                  `成功率${successRate.toFixed(0)}%`);
    }

    // ===== 4. 自压测 - 带认证头 =====
    console.log('\n[3/5] 自压测 - 测试系统自身API(带认证)');
    console.log('-'.repeat(50));

    const selfEnvRes = await request('POST', '/environments', {
      app_id: appId,
      name: '自测试环境',
      type: 'test',
      base_url: `http://${API_HOST}:${API_PORT}`
    }, globalToken);
    const selfEnvId = selfEnvRes.body.id;

    const selfTestTasks = [
      { name: '健康检查', endpoint: '/api/health', withAuth: false },
      { name: '应用列表API', endpoint: '/api/applications', withAuth: true },
      { name: '用户列表API', endpoint: '/api/users', withAuth: true }
    ];

    const selfTaskIds = [];
    for (const t of selfTestTasks) {
      const headers = t.withAuth ? { 'Authorization': `Bearer ${globalToken}` } : {};
      const taskRes = await request('POST', '/tasks', {
        app_id: appId, env_id: selfEnvId,
        name: `自压测-${t.name}`,
        api_endpoint: t.endpoint,
        method: 'GET',
        headers: headers,
        concurrency: 3,
        requests: 30
      }, globalToken);
      
      if (taskRes.status === 201) {
        selfTaskIds.push({ id: taskRes.body.id, ...t });
        await request('POST', `/tasks/${taskRes.body.id}/execute`, {}, globalToken);
        console.log(`  ✅ 启动: ${t.name} ${t.withAuth ? '(带认证)' : ''}`);
      }
    }

    console.log('\n  ⏳  等待自压测完成 (15秒)...');
    await new Promise(r => setTimeout(r, 15000));

    console.log('\n  验证自压测结果:');
    for (const task of selfTaskIds) {
      const resultRes = await request('GET', `/tasks/${task.id}`, null, globalToken);
      const stats = resultRes.body.stats;
      const success = stats?.success_count || 0;
      const total = stats?.total_requests || 0;
      const passed = success === total && total > 0;
      recordTest(`自压测-${task.name} - 100%成功率`, passed);
      console.log(`     结果: ${success}/${total} 成功, 平均${Math.round(stats?.avg_response_time||0)}ms`);
    }

    // ===== 5. 调用日志验证 =====
    console.log('\n[4/5] 调用日志验证');
    console.log('-'.repeat(50));
    
    const logsRes = await request('GET', `/tasks/${taskIds[0].id}/logs?page_size=100`, null, globalToken);
    const logs = logsRes.body.data || logsRes.body;
    recordTest('获取调用日志', Array.isArray(logs) && logs.length > 0);
    
    if (logs.length > 0) {
      const hasStatusCode = logs[0].status_code !== undefined;
      const hasResponseTime = logs[0].response_time !== undefined;
      recordTest('日志字段完整性', hasStatusCode && hasResponseTime);
      console.log(`     日志条数: ${logs.length}`);
      console.log(`     示例: HTTP ${logs[0].status_code}, ${logs[0].response_time}ms`);
    }

    // ===== 6. 任务取消测试 =====
    console.log('\n[5/5] 任务取消功能测试');
    console.log('-'.repeat(50));
    
    const slowTaskRes = await request('POST', '/tasks', {
      app_id: appId, env_id: envId,
      name: '可取消任务-慢接口',
      api_endpoint: '/api/slow',
      method: 'GET',
      concurrency: 2,
      requests: 100
    }, globalToken);
    
    if (slowTaskRes.status === 201) {
      await request('POST', `/tasks/${slowTaskRes.body.id}/execute`, {}, globalToken);
      await new Promise(r => setTimeout(r, 2000));
      
      const cancelRes = await request('POST', `/tasks/${slowTaskRes.body.id}/cancel`, {}, globalToken);
      recordTest('取消正在运行的任务', cancelRes.status === 200);
      
      await new Promise(r => setTimeout(r, 2000));
      const canceledTask = await request('GET', `/tasks/${slowTaskRes.body.id}`, null, globalToken);
      recordTest('任务状态变为cancelled', canceledTask.body.status === 'cancelled');
    }

    // ===== 汇总 =====
    console.log('\n' + '='.repeat(70));
    console.log('   测试结果汇总');
    console.log('='.repeat(70));
    
    const passed = testResults.filter(t => t.passed).length;
    const total = testResults.length;
    console.log(`\n总测试用例: ${total}`);
    console.log(`通过: ${passed} / ${total} (${((passed/total)*100).toFixed(1)}%)`);
    
    if (total - passed > 0) {
      console.log('\n失败详情:');
      testResults.filter(t => !t.passed).forEach(t => console.log(`  ❌ ${t.name}`));
    }

    console.log('\n' + '='.repeat(70));
    console.log('   压测功能验证完成！前端: http://127.0.0.1:43382');
    console.log('='.repeat(70));

  } catch (e) {
    console.error('\n❌ 测试失败:', e.message);
    console.error(e.stack);
  }
}

runTest();
