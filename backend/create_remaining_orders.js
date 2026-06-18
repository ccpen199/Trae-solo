const axios = require('axios');

const API = 'http://127.0.0.1:59231/api';

async function login(username, password) {
  const res = await axios.post(`${API}/auth/login`, { username, password });
  return res.data.token;
}

async function createOrder(token, employerId, data) {
  const res = await axios.post(
    `${API}/orders`,
    { employer_id: employerId, ...data },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.id;
}

async function acceptOrder(token, orderId, workerId) {
  const res = await axios.post(
    `${API}/orders/${orderId}/accept`,
    { worker_id: workerId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

async function run() {
  console.log('=== 创建缺失的订单 ===');

  const adminToken = await login('admin', 'admin123');
  const employer2Token = await login('employer2', 'employer123');
  const employer1Token = await login('employer1', 'employer123');

  const employerIds = {
    employer1: '705492c3-3af6-451e-ba0a-f6562e850331',
    employer2: 'd78feaa5-658d-4d57-a7a7-a812dfeef82c',
    employer3: '0a93879d-7c92-4a1b-a289-25445ffbe338',
  };

  const workerIds = {
    chen: '4a1b455b-cba1-4e0a-80bf-1299ac3a5313',
    liu: 'de0c186e-835d-4423-8106-6357d1d0ff94',
    zhang: '191b4fc4-62e5-4771-b98c-336baeca2929',
    wang: '5b3cb89c-fa06-448e-ad26-6a67d1472579',
    li: '83b65d02-bf25-4059-9b7d-a03a94c9c3df',
  };

  // 获取已存在的订单列表，找到order6的id
  const ordersRes = await axios.get(`${API}/orders?pageSize=100`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const orders = ordersRes.data.list;
  console.log('已有订单:', orders.length);

  // 找到静安区日常保洁 (in_progress, worker:陈阿姨) 的订单，将其转为纠纷中
  const order6 = orders.find(o => o.title.includes('静安区日常保洁') && o.worker_name === '陈阿姨');
  if (order6) {
    console.log('将订单转为纠纷中:', order6.id);
    const res = await axios.post(
      `${API}/support/disputes`,
      {
        order_id: order6.id,
        title: '清洁质量问题',
        type: 'service_quality',
        description: '厨房油污未清理干净，要求退款50%',
      },
      { headers: { Authorization: `Bearer ${employer2Token}` } }
    );
    console.log('  纠纷创建成功:', res.data.id);
  }

  // 创建order7: 保洁抢单（待抢单）
  console.log('=== 创建订单7: 新居开荒保洁抢单 ===');
  const order7Id = await createOrder(adminToken, employerIds.employer2, {
    mode: 'grab',
    service_type: 'cleaner',
    title: '静安区南京西路新居开荒保洁',
    description: '100平米新居开荒，去除装修残留和灰尘',
    duration_hours: 8,
    frequency: 'once',
    start_date: '2026-06-25',
    end_date: '2026-06-25',
    work_times: ['08:00-16:00'],
    budget_min: 600,
    budget_max: 800,
    special_requirements: ['需要自带开荒工具', '注意保护新地板'],
    longitude: 121.452,
    latitude: 31.228,
    address: '上海市静安区南京西路1266号',
    city: '上海市',
    district: '静安区',
  });
  console.log('  order7Id:', order7Id);

  // 创建order8: 月嫂派单（已接单）
  console.log('=== 创建订单8: 月嫂派单 ===');
  const order8Id = await createOrder(adminToken, employerIds.employer1, {
    mode: 'dispatch',
    service_type: 'maternity',
    title: '徐汇区月嫂服务',
    description: '预产期2026年8月，需要26天住家月嫂',
    duration_hours: 24,
    frequency: 'once',
    start_date: '2026-08-10',
    end_date: '2026-09-05',
    work_times: ['住家24小时'],
    budget_min: 16000,
    budget_max: 20000,
    special_requirements: ['有催乳经验优先'],
    longitude: 121.437,
    latitude: 31.2001,
    address: '上海市徐汇区衡山路100号',
    city: '上海市',
    district: '徐汇区',
  });
  await acceptOrder(adminToken, order8Id, workerIds.zhang);
  console.log('  order8Id:', order8Id, '已派给张阿姨');

  console.log('=== 完成 ===');
}

run().catch(e => {
  console.error('ERROR:', e.response?.data || e.message);
  process.exit(1);
});
