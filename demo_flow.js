const http = require('http');

function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: '127.0.0.1',
      port: 56383,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (postData) options.headers['Content-Length'] = Buffer.byteLength(postData);
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { resolve(body); }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function demo() {
  try {
    console.log('=== 日志脱敏代理服务 - 完整业务流程演示 ===');
    console.log('');
    
    const login = await request('POST', '/auth/login', {username:'admin',password:'admin123'});
    const token = login.token;
    console.log('1. 用户登录: admin (系统管理员)');
    console.log('');
    
    console.log('2. 应用台账 (已创建 2 个应用)');
    const apps = await request('GET', '/applications', null, token);
    apps.forEach(app => {
      console.log(`   - ${app.name} (${app.app_id}) [${app.environment}]`);
    });
    const app1 = apps[0];
    console.log('');
    
    console.log('3. 脱敏规则配置');
    const rules = await request('GET', '/rules', null, token);
    console.log(`   已配置 ${rules.length} 条脱敏规则:`);
    rules.forEach(r => {
      console.log(`   - [${r.name}] 类型: ${r.rule_type}, 状态: ${r.is_active ? '启用' : '停用'}`);
    });
    console.log('');
    
    console.log('4. 创建执行任务 - 模拟订单日志脱敏');
    const testLog = `
      [2026-05-24 10:30:25] 订单创建成功
      订单号: ORDER202605240001
      收货人: 张三
      手机号: 13812345678
      身份证: 110101199001011234
      银行卡: 6222021234567890123
      邮箱: zhangsan@example.com
      收货地址: 北京市朝阳区某某街道123号
    `;
    const task = await request('POST', '/tasks', {
      app_id: app1.id,
      operation_type: 'mask',
      input_data: testLog.trim(),
      priority: 'high',
      rule_version: 1
    }, token);
    console.log(`   任务已创建: ${task.task_id}`);
    console.log('');
    
    console.log('5. 审批任务 (admin 审批)');
    const approved = await request('POST', `/tasks/${task.id}/approve`, {remark: '规则版本校验通过，同意执行'}, token);
    console.log(`   任务状态: ${approved.status}`);
    console.log('');
    
    console.log('6. 执行脱敏任务');
    const executed = await request('POST', `/tasks/${task.id}/execute`, null, token);
    console.log(`   任务状态: ${executed.status} (执行中...)`);
    console.log('');
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('7. 查看执行结果');
    const result = await request('GET', `/tasks/${task.id}`, null, token);
    console.log(`   任务状态: ${result.status}`);
    console.log('');
    console.log('   --- 原始日志 ---');
    console.log(result.input_data);
    console.log('');
    console.log('   --- 脱敏后日志 ---');
    console.log(result.output_data);
    console.log('');
    
    console.log('8. 调用日志记录');
    const logs = await request('GET', '/logs/call', null, token);
    console.log(`   已记录 ${logs.length} 条调用日志`);
    if (logs.length > 0) {
      const latest = logs[0];
      console.log(`   最新日志: ${latest.log_id}, 处理数量: ${latest.processed_count}`);
    }
    console.log('');
    
    console.log('9. 变更单管理');
    const orders = await request('GET', '/change-orders', null, token);
    console.log(`   已创建 ${orders.length} 条变更单`);
    console.log('');
    
    console.log('=== 业务流程演示完成 ===');
    console.log('');
    console.log('访问 http://127.0.0.1:46383 登录系统');
    console.log('账号: admin / admin123');
    
  } catch (error) {
    console.error('错误:', error.message);
  }
}

demo();
