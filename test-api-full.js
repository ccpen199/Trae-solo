const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('=== AI招投标标书助手 - 完整业务流程测试 ===\n');

  // 1. 模型运营登录
  console.log('1. 模型运营登录:');
  const login = await request({
    hostname: '127.0.0.1', port: 53360, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'operator', password: '123456' });
  console.log('   用户:', login.data.user.real_name, '-', login.data.user.role_description);
  const token = login.data.token;

  // 2. 创建标书
  console.log('\n2. 创建标书:');
  const bid = await request({
    hostname: '127.0.0.1', port: 53360, path: '/api/bids', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, { project_name: '市政工程项目招标', purchaser: '市住建局', budget_amount: 8000000 });
  console.log('   标书ID:', bid.data.id, '状态: draft');
  const bidId = bid.data.id;

  // 3. 解析标书
  console.log('\n3. 解析标书:');
  const parse = await request({
    hostname: '127.0.0.1', port: 53360, path: `/api/bids/${bidId}/parse`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, {});
  console.log('   状态:', parse.status === 200 ? '成功' : '失败');
  console.log('   提取评分项:', parse.data.items?.length || 0, '个');
  console.log('   缺漏检查:', parse.data.missing_count || 0, '项');

  // 4. 资质匹配
  console.log('\n4. 资质匹配:');
  const match = await request({
    hostname: '127.0.0.1', port: 53360, path: `/api/bids/${bidId}/match`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, {});
  console.log('   状态:', match.status === 200 ? '成功' : '失败');
  console.log('   匹配资质:', match.data.qualifications?.length || 0, '项');

  // 5. 生成响应
  console.log('\n5. 生成响应:');
  const generate = await request({
    hostname: '127.0.0.1', port: 53360, path: `/api/bids/${bidId}/generate`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, {});
  console.log('   状态:', generate.status === 200 ? '成功' : '失败');
  console.log('   生成响应:', generate.data.responses?.length || 0, '条');

  // 6. 导出标书
  console.log('\n6. 导出标书:');
  const exportRes = await request({
    hostname: '127.0.0.1', port: 53360, path: `/api/bids/${bidId}/export`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, {});
  console.log('   状态:', exportRes.status === 200 ? '成功' : '失败');

  // 7. 获取标书详情
  console.log('\n7. 获取标书详情:');
  const detail = await request({
    hostname: '127.0.0.1', port: 53360, path: `/api/bids/${bidId}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('   项目:', detail.data.bid?.project_name);
  console.log('   当前状态:', detail.data.bid?.status);
  console.log('   评分项:', detail.data.items?.length, '个');
  console.log('   响应:', detail.data.responses?.length, '条');
  console.log('   资质匹配:', detail.data.qualifications?.length, '项');
  console.log('   状态变更记录:', detail.data.statusHistory?.length, '条');

  // 8. 业务台账
  console.log('\n8. 业务台账:');
  const ledger = await request({
    hostname: '127.0.0.1', port: 53360, path: `/api/ledger?bid_id=${bidId}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('   记录数:', ledger.data.total);
  ledger.data.list.forEach(l => {
    console.log(`   - ${l.action_type}: ${l.status} (${l.operator_name})`);
  });

  // 9. 模拟异常 - PDF解析失败
  console.log('\n9. 模拟异常 - PDF解析失败:');
  const newBid = await request({
    hostname: '127.0.0.1', port: 53360, path: '/api/bids', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, { project_name: '异常测试项目' });
  const failParse = await request({
    hostname: '127.0.0.1', port: 53360, path: `/api/bids/${newBid.data.id}/parse`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, { simulate_error: 'pdf_parse_failure' });
  console.log('   错误:', failParse.data.error);

  // 10. 异常日志
  console.log('\n10. 异常日志:');
  const exceptions = await request({
    hostname: '127.0.0.1', port: 53360, path: '/api/exceptions?pageSize=3', method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('   待处理:', exceptions.data.list.filter(e => e.status === 'pending').length);
  console.log('   总数:', exceptions.data.total);

  console.log('\n=== 测试完成 ===');
  console.log('\n=============================================');
  console.log('服务访问地址:');
  console.log('  前端: http://127.0.0.1:43360');
  console.log('  后端: http://127.0.0.1:53360');
  console.log('\n测试账号:');
  console.log('  owner / 123456    (业务负责人 - 全部权限)');
  console.log('  operator / 123456 (模型运营 - 解析/匹配/生成)');
  console.log('  reviewer / 123456 (审核人员 - 审核)');
  console.log('  user / 123456     (一线使用者 - 查看/创建)');
  console.log('=============================================');
}

main().catch(console.error);
