const http = require('http');

function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: '127.0.0.1',
      port: 56383,
      path: '/api' + path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (postData) options.headers['Content-Length'] = Buffer.byteLength(postData);
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { resolve(body); } });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function test() {
  try {
    const login = await request('POST', '/auth/login', {username:'admin',password:'admin123'});
    const token = login.token;
    
    const apps = await request('GET', '/applications', null, token);
    const app1 = apps[0];
    console.log('测试应用:', app1.name);
    
    const testContent = `非常不错 ccem@163.com. 我的银行账号
5647473837728334`;
    console.log('');
    console.log('=== 原始内容 ===');
    console.log(testContent);
    
    console.log('');
    console.log('=== 创建脱敏任务 ===');
    const task = await request('POST', '/tasks', {
      app_id: app1.id,
      operation_type: 'mask',
      input_data: testContent,
      priority: 'high',
      rule_version: 4
    }, token);
    console.log('任务ID:', task.task_id);
    
    await request('POST', `/tasks/${task.id}/approve`, {remark:'自动测试审批'}, token);
    await request('POST', `/tasks/${task.id}/execute`, null, token);
    
    await new Promise(r => setTimeout(r, 1500));
    
    const result = await request('GET', `/tasks/${task.id}`, null, token);
    console.log('');
    console.log('=== 处理结果 ===');
    console.log(result.output_data);
    console.log('');
    console.log('状态:', result.status, '处理数量:', result.processed_count);
    
  } catch (error) {
    console.error('错误:', error.message);
  }
}

test();
