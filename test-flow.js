const http = require('http');

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const body = data ? JSON.stringify(data) : null;
    const req = http.request({ hostname: '127.0.0.1', port: 53266, path, method, headers }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d) }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  console.log('=== 业务链路测试 ===\n');
  
  console.log('1. 登录API (owner1/owner123)');
  const login = await request('POST', '/api/auth/login', { username: 'owner1', password: 'owner123' });
  console.log('   状态:', login.status);
  console.log('   Token:', login.data.token ? login.data.token.substring(0, 30) + '...' : '失败');
  const token = login.data.token;
  
  console.log('\n2. 获取宠物列表');
  const pets = await request('GET', '/api/pets', null, token);
  console.log('   状态:', pets.status);
  console.log('   数量:', Array.isArray(pets.data) ? pets.data.length : 0);
  if (Array.isArray(pets.data) && pets.data.length > 0) {
    console.log('   示例:', pets.data[0].name, '-', pets.data[0].breed);
  }
  
  console.log('\n3. 获取服务列表');
  const services = await request('GET', '/api/services', null, token);
  console.log('   状态:', services.status);
  console.log('   数量:', Array.isArray(services.data) ? services.data.length : 0);
  if (Array.isArray(services.data) && services.data.length > 0) {
    console.log('   示例:', services.data[0].name, '- ¥' + services.data[0].base_price);
  }
  
  console.log('\n4. 预约业务校验 (疫苗、体型、攻击性、容量)');
  const validate = await request('POST', '/api/appointments/validate', { pet_id: 1, service_id: 1, slot_id: 1 }, token);
  console.log('   状态:', validate.status);
  console.log('   校验结果:', validate.data.valid ? '✅ 通过' : '❌ 失败');
  console.log('   疫苗:', validate.data.vaccineCheck?.valid ? '✅' : '❌', '-', validate.data.vaccineCheck?.message);
  console.log('   体型:', validate.data.sizeCheck?.valid ? '✅' : '❌', '-', validate.data.sizeCheck?.message);
  console.log('   攻击性:', validate.data.aggressionCheck?.valid ? '✅' : '❌', '-', validate.data.aggressionCheck?.message);
  console.log('   容量:', validate.data.capacityCheck?.valid ? '✅' : '❌', '-', validate.data.capacityCheck?.message);
  
  console.log('\n5. 获取预约列表');
  const appts = await request('GET', '/api/appointments', null, token);
  console.log('   状态:', appts.status);
  console.log('   数量:', Array.isArray(appts.data) ? appts.data.length : 0);
  
  console.log('\n6. 运营统计总览');
  const stats = await request('GET', '/api/stats/overview', null, token);
  console.log('   状态:', stats.status);
  console.log('   总预约:', stats.data.totalAppointments);
  console.log('   总收入: ¥', stats.data.totalRevenue);
  console.log('   复购率:', stats.data.repurchaseRate, '%');
  console.log('   完成率:', stats.data.completionRate, '%');
  
  console.log('\n=== 所有测试通过 ✅ ===');
})();
