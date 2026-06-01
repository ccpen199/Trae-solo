const http = require('http');

const API_BASE = '127.0.0.1';
const API_PORT = 53382;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      port: API_PORT,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
    
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

async function runTest() {
  console.log('=== API 压测功能测试 ===\n');
  
  try {
    // 1. 登录
    console.log('[1/6] 登录...');
    const loginRes = await request('POST', '/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    const token = loginRes.body.token;
    console.log('✅ 登录成功');
    
    // 2. 创建应用
    console.log('\n[2/6] 创建应用...');
    const appRes = await request('POST', '/applications', {
      name: 'Demo测试应用',
      description: '压测演示应用',
      owner_id: 1,
      status: 'active'
    }, token);
    const appId = appRes.body.id;
    console.log('✅ 应用创建成功, ID:', appId);
    
    // 3. 创建环境
    console.log('\n[3/6] 创建环境...');
    const envRes = await request('POST', '/environments', {
      app_id: appId,
      name: '测试环境',
      type: 'test',
      base_url: 'http://127.0.0.1:54383'
    }, token);
    const envId = envRes.body.id;
    console.log('✅ 环境创建成功, ID:', envId);
    console.log('   响应:', JSON.stringify(envRes.body));
    
    // 4. 创建压测任务
    console.log('\n[4/6] 创建压测任务...');
    const taskRes = await request('POST', '/tasks', {
      app_id: appId,
      env_id: envId,
      name: '健康检查压测',
      description: '测试压测功能',
      api_endpoint: '/api/health',
      method: 'GET',
      concurrency: 3,
      requests: 30
    }, token);
    console.log('   状态码:', taskRes.status);
    console.log('   响应:', JSON.stringify(taskRes.body));
    
    if (taskRes.status !== 201) {
      console.log('❌ 任务创建失败');
      return;
    }
    
    const taskId = taskRes.body.id;
    console.log('✅ 任务创建成功, ID:', taskId);
    
    // 5. 执行压测任务
    console.log('\n[5/6] 执行压测任务...');
    const execRes = await request('POST', `/tasks/${taskId}/execute`, {}, token);
    console.log('   执行响应:', JSON.stringify(execRes.body));
    console.log('⏳ 等待压测执行 (8秒)...');
    await new Promise(r => setTimeout(r, 8000));
    
    // 6. 查看结果
    console.log('\n[6/6] 查看结果...');
    const resultRes = await request('GET', `/tasks/${taskId}`, null, token);
    const task = resultRes.body;
    console.log('   状态:', task.status);
    console.log('   成功请求:', task.success_count || 0);
    console.log('   失败请求:', task.fail_count || 0);
    console.log('   平均响应:', task.avg_response_time || 0, 'ms');
    
    console.log('\n=== 测试完成! ===');
    console.log('前端访问: http://127.0.0.1:43382');
    
  } catch (e) {
    console.error('❌ 测试失败:', e.message);
  }
}

runTest();
