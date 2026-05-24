const axios = require('axios');

const API_BASE = 'http://127.0.0.1:52266/api';

async function test() {
  console.log('=== 后端角色权限测试 ===\n');
  
  // 1. 管理员登录
  console.log('1. 管理员登录...');
  const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
    username: 'admin',
    password: 'admin123'
  });
  console.log(`   角色: ${adminLogin.data.user.role}`);
  console.log(`   昵称: ${adminLogin.data.user.nickname}`);
  const adminToken = adminLogin.data.token;
  
  // 2. 管理员尝试创建球局（应该返回403）
  console.log('\n2. 管理员尝试创建球局（应该返回403）...');
  try {
    await axios.post(`${API_BASE}/games`, {
      court_id: 1, time_slot_id: 1, sport_type: 'badminton',
      title: '管理员测试球局', description: '验证权限',
      level_required: 3, max_players: 4, min_players: 2,
      aa_rule: 'average', deposit_amount: 20
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('   ❌ 错误：管理员居然能创建球局！');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log(`   ✅ 正确返回403: ${err.response.data.error}`);
    } else {
      console.log(`   ⚠️  返回了${err.response?.status}: ${err.response?.data?.error}`);
    }
  }
  
  // 3. 运营人员登录
  console.log('\n3. 运营人员登录...');
  const opLogin = await axios.post(`${API_BASE}/auth/login`, {
    username: 'operator',
    password: 'operator123'
  });
  console.log(`   角色: ${opLogin.data.user.role}`);
  const opToken = opLogin.data.token;
  
  // 4. 运营人员尝试创建球局（应该返回403）
  console.log('\n4. 运营人员尝试创建球局（应该返回403）...');
  try {
    await axios.post(`${API_BASE}/games`, {
      court_id: 1, time_slot_id: 1, sport_type: 'badminton',
      title: '运营测试球局', description: '验证权限',
      level_required: 3, max_players: 4, min_players: 2,
      aa_rule: 'average', deposit_amount: 20
    }, {
      headers: { Authorization: `Bearer ${opToken}` }
    });
    console.log('   ❌ 错误：运营人员居然能创建球局！');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log(`   ✅ 正确返回403: ${err.response.data.error}`);
    } else {
      console.log(`   ⚠️  返回了${err.response?.status}: ${err.response?.data?.error}`);
    }
  }
  
  // 5. 普通用户登录
  console.log('\n5. 普通用户登录...');
  const userLogin = await axios.post(`${API_BASE}/auth/login`, {
    username: 'user1',
    password: 'user123'
  });
  console.log(`   角色: ${userLogin.data.user.role}`);
  const userToken = userLogin.data.token;
  
  // 6. 普通用户尝试创建球局（应该成功）
  console.log('\n6. 普通用户尝试创建球局（应该成功）...');
  try {
    const res = await axios.post(`${API_BASE}/games`, {
      court_id: 1, time_slot_id: 2, sport_type: 'badminton',
      title: '用户测试球局', description: '验证权限',
      level_required: 3, max_players: 4, min_players: 2,
      aa_rule: 'average', deposit_amount: 20
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log(`   ✅ 创建成功！球局ID: ${res.data.id}`);
  } catch (err) {
    console.log(`   ❌ 错误: ${err.response?.status} - ${err.response?.data?.error}`);
  }
  
  console.log('\n=== 权限测试完成 ===');
}

test().catch(err => {
  console.error('测试失败:', err.message);
  if (err.response) {
    console.error('响应:', err.response.status, err.response.data);
  }
});
