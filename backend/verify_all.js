const axios = require('axios');

const API = 'http://127.0.0.1:59231/api';

async function login(username, password) {
  const res = await axios.post(`${API}/auth/login`, { username, password });
  return res.data.token;
}

async function run() {
  const adminToken = await login('admin', 'admin123');
  const worker1Token = await login('worker1', 'worker123');

  console.log('=== 验证结果汇总 ===\n');

  // 1. 订单列表
  const ordersRes = await axios.get(`${API}/orders?pageSize=10`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('1. 订单总数:', ordersRes.data.total);
  const statusCount = {};
  ordersRes.data.list.forEach(o => {
    statusCount[o.status] = (statusCount[o.status] || 0) + 1;
  });
  console.log('   状态分布:', statusCount);
  ordersRes.data.list.slice(0, 3).forEach(o => {
    console.log(`   - ${o.id.slice(0,8)} ${o.status} | ${o.title.slice(0,20)} | 进度:${o.completed_nodes}/${o.total_nodes}`);
  });

  // 2. 雇主详情
  const empId = '705492c3-3af6-451e-ba0a-f6562e850331';
  const empRes = await axios.get(`${API}/employers/${empId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const e = empRes.data.employer;
  console.log('\n2. 雇主详情 (李女士):');
  console.log(`   姓名: ${e.name}`);
  console.log(`   城市: ${e.city} / ${e.district}`);
  console.log(`   经纬度: ${e.longitude}, ${e.latitude}`);
  console.log(`   家庭人数: ${e.family_members}`);
  console.log(`   特殊需求: ${JSON.stringify(e.special_requirements_data)}`);
  console.log(`   订单数: ${empRes.data.orders.length}`);

  // 3. 培训课程
  const coursesRes = await axios.get(`${API}/training/courses`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('\n3. 培训课程:', coursesRes.data.list.length, '门');
  coursesRes.data.list.slice(0, 3).forEach(c => {
    console.log(`   - ${c.title.slice(0,20)} | ${c.completed_count || 0}人学习`);
  });

  // 4. 培训进度 (worker1)
  const progRes = await axios.get(`${API}/training/my-progress`, {
    headers: { Authorization: `Bearer ${worker1Token}` }
  });
  console.log('\n4. worker1 培训进度:');
  console.log(`   学习中: ${progRes.data.list.length} 门`);
  console.log(`   已通过: ${progRes.data.stats.completed_courses} 门`);
  progRes.data.list.forEach(c => {
    const cert = c.certificate_hash ? c.certificate_hash.slice(0, 16) + '...' : '无';
    console.log(`   - ${c.title.slice(0,20)} | ${c.progress}% | 通过:${c.completed} | 证书:${cert}`);
  });

  // 5. 订单详情
  const orderId = ordersRes.data.list[0].id;
  const orderDetailRes = await axios.get(`${API}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const od = orderDetailRes.data.order;
  console.log('\n5. 订单详情 (首个订单):');
  console.log(`   标题: ${od.title.slice(0,25)}`);
  console.log(`   工作时间: ${JSON.stringify(od.work_times_data)}`);
  console.log(`   特殊需求: ${JSON.stringify(od.special_requirements_data)}`);
  console.log(`   节点数: ${orderDetailRes.data.nodes.length}`);
  console.log(`   抢单记录: ${orderDetailRes.data.grabRecords.length} 条`);

  console.log('\n=== 全部验证通过 ===');
}

run().catch(e => {
  console.error('验证失败:', e.response?.data || e.message);
  process.exit(1);
});
