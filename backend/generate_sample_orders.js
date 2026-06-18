const axios = require('axios');

const API = 'http://127.0.0.1:59231/api';
axios.interceptors.response.use(
  (r) => r,
  (e) => {
    console.error('API ERROR:', e.config?.url, e.response?.data || e.message);
    return Promise.reject(e);
  }
);

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

async function grabOrder(token, orderId) {
  const res = await axios.post(
    `${API}/orders/${orderId}/grab`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

async function acceptOrder(token, orderId, workerId) {
  const res = await axios.post(
    `${API}/orders/${orderId}/accept`,
    { worker_id: workerId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

async function checkinOrder(token, orderId, gps) {
  const res = await axios.post(
    `${API}/orders/${orderId}/checkin`,
    { gps: { latitude: gps.lat, longitude: gps.lng }, face_verified: true },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

async function completeNode(token, orderId, nodeId) {
  const res = await axios.post(
    `${API}/orders/${orderId}/nodes/${nodeId}/complete`,
    { status: 'completed', completed_note: '已完成' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

async function completeOrder(token, orderId, amount) {
  const res = await axios.post(
    `${API}/orders/${orderId}/complete`,
    { actual_amount: amount },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

async function reviewOrder(token, orderId, rating, content) {
  const res = await axios.post(
    `${API}/orders/${orderId}/review`,
    { rating, content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

async function getOrderDetail(token, orderId) {
  const res = await axios.get(`${API}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

async function run() {
  console.log('登录中...');
  const adminToken = await login('admin', 'admin123');
  const worker1Token = await login('worker1', 'worker123');
  const worker2Token = await login('worker2', 'worker123');
  const worker3Token = await login('worker3', 'worker123');
  const worker4Token = await login('worker4', 'worker123');
  const worker5Token = await login('worker5', 'worker123');
  const employer1Token = await login('employer1', 'employer123');
  const employer2Token = await login('employer2', 'employer123');
  const employer3Token = await login('employer3', 'employer123');

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

  console.log('=== 创建订单1: 保洁抢单（待抢单，pending） ===');
  const order1Id = await createOrder(adminToken, employerIds.employer1, {
    mode: 'grab',
    service_type: 'cleaner',
    title: '徐汇区衡山路家庭深度保洁',
    description: '120平米三居室，深度清洁，含厨房油污处理和玻璃擦拭',
    duration_hours: 4,
    frequency: 'weekly',
    start_date: '2026-06-20',
    end_date: '2026-07-20',
    work_times: ['09:00-13:00'],
    budget_min: 200,
    budget_max: 280,
    special_requirements: ['需要自带清洁工具', '有宠物猫注意过敏'],
    longitude: 121.437,
    latitude: 31.2001,
    address: '上海市徐汇区衡山路100号',
    city: '上海市',
    district: '徐汇区',
  });
  console.log('  order1Id:', order1Id);

  console.log('=== 创建订单2: 保姆抢单（已被抢，待雇主确认） ===');
  const order2Id = await createOrder(adminToken, employerIds.employer3, {
    mode: 'grab',
    service_type: 'nanny',
    title: '浦东新区陆家嘴3岁宝宝日间照料',
    description: '周一至周五，白天照顾3岁男宝，含辅食制作和早教互动',
    duration_hours: 8,
    frequency: 'daily',
    start_date: '2026-06-22',
    end_date: '2026-12-31',
    work_times: ['08:00-16:00'],
    budget_min: 6000,
    budget_max: 8000,
    special_requirements: ['要求有育婴师证', '有早教经验优先'],
    longitude: 121.5049,
    latitude: 31.2397,
    address: '上海市浦东新区陆家嘴环路1000号',
    city: '上海市',
    district: '浦东新区',
  });
  console.log('  order2Id:', order2Id);
  await grabOrder(worker2Token, order2Id);
  await grabOrder(worker5Token, order2Id);
  console.log('  刘阿姨和李阿姨已抢单');
  await acceptOrder(employer3Token, order2Id, workerIds.liu);
  console.log('  雇主张先生已确认派给刘阿姨');

  console.log('=== 创建订单3: 月嫂派单（已接单，accepted） ===');
  const order3Id = await createOrder(adminToken, employerIds.employer2, {
    mode: 'dispatch',
    service_type: 'maternity',
    title: '静安区南京西路月嫂服务',
    description: '预产期2026年7月15日，需要住家月嫂26天服务',
    duration_hours: 24,
    frequency: 'once',
    start_date: '2026-07-15',
    end_date: '2026-08-10',
    work_times: ['住家24小时'],
    budget_min: 18000,
    budget_max: 22000,
    special_requirements: ['高级母婴护理师证', '有催乳经验', '5年以上经验'],
    longitude: 121.452,
    latitude: 31.228,
    address: '上海市静安区南京西路1266号',
    city: '上海市',
    district: '静安区',
  });
  await acceptOrder(adminToken, order3Id, workerIds.zhang);
  console.log('  order3Id:', order3Id, '已派给张阿姨');

  console.log('=== 创建订单4: 保洁服务中（in_progress，已打卡，部分节点完成） ===');
  const order4Id = await createOrder(adminToken, employerIds.employer1, {
    mode: 'dispatch',
    service_type: 'cleaner',
    title: '徐汇区衡山路日常保洁',
    description: '80平米两居室日常清洁',
    duration_hours: 3,
    frequency: 'weekly',
    start_date: '2026-06-18',
    end_date: '2026-09-18',
    work_times: ['14:00-17:00'],
    budget_min: 150,
    budget_max: 200,
    special_requirements: ['重点清洁卫生间'],
    longitude: 121.437,
    latitude: 31.2001,
    address: '上海市徐汇区衡山路100号',
    city: '上海市',
    district: '徐汇区',
  });
  await acceptOrder(adminToken, order4Id, workerIds.wang);
  await checkinOrder(worker4Token, order4Id, { lat: 31.2001, lng: 121.437 });
  const order4Detail = await getOrderDetail(adminToken, order4Id);
  const nodes4 = order4Detail.nodes;
  for (let i = 0; i < 4; i++) {
    await completeNode(worker4Token, order4Id, nodes4[i].id);
  }
  console.log('  order4Id:', order4Id, '已打卡+4个节点完成');

  console.log('=== 创建订单5: 保姆已完成（completed，全流程） ===');
  const order5Id = await createOrder(adminToken, employerIds.employer3, {
    mode: 'grab',
    service_type: 'nanny',
    title: '陆家嘴临时育儿服务',
    description: '周末临时照顾宝宝2天',
    duration_hours: 10,
    frequency: 'once',
    start_date: '2026-06-15',
    end_date: '2026-06-15',
    work_times: ['08:00-18:00'],
    budget_min: 400,
    budget_max: 500,
    special_requirements: ['需要有耐心'],
    longitude: 121.5049,
    latitude: 31.2397,
    address: '上海市浦东新区陆家嘴环路1000号',
    city: '上海市',
    district: '浦东新区',
  });
  await grabOrder(worker5Token, order5Id);
  await acceptOrder(employer3Token, order5Id, workerIds.li);
  await checkinOrder(worker5Token, order5Id, { lat: 31.2397, lng: 121.5049 });
  const order5Detail = await getOrderDetail(adminToken, order5Id);
  const nodes5 = order5Detail.nodes;
  for (const node of nodes5) {
    await completeNode(worker5Token, order5Id, node.id);
  }
  await completeOrder(worker5Token, order5Id, 480);
  await reviewOrder(employer3Token, order5Id, 5, '李阿姨非常专业，对宝宝很有耐心，服务态度好，下次还会约！');
  console.log('  order5Id:', order5Id, '已完成+评价');

  console.log('=== 创建订单6: 保洁纠纷中（disputed） ===');
  const order6Id = await createOrder(adminToken, employerIds.employer2, {
    mode: 'dispatch',
    service_type: 'cleaner',
    title: '静安区日常保洁',
    description: '90平米日常清洁',
    duration_hours: 3,
    frequency: 'biweekly',
    start_date: '2026-06-10',
    end_date: '2026-12-10',
    work_times: ['09:00-12:00'],
    budget_min: 180,
    budget_max: 220,
    special_requirements: ['注意擦拭古董摆件'],
    longitude: 121.452,
    latitude: 31.228,
    address: '上海市静安区南京西路1266号',
    city: '上海市',
    district: '静安区',
  });
  await acceptOrder(adminToken, order6Id, workerIds.chen);
  await checkinOrder(worker1Token, order6Id, { lat: 31.228, lng: 121.452 });
  const order6Detail = await getOrderDetail(adminToken, order6Id);
  const nodes6 = order6Detail.nodes;
  for (let i = 0; i < 5; i++) {
    await completeNode(worker1Token, order6Id, nodes6[i].id);
  }
  await completeOrder(worker1Token, order6Id, 200);
  await axios.post(
    `${API}/support/disputes`,
    {
      order_id: order6Id,
      type: 'service_quality',
      description: '厨房油污未清理干净，要求退款50%',
    },
    { headers: { Authorization: `Bearer ${employer2Token}` } }
  );
  console.log('  order6Id:', order6Id, '已完成，纠纷处理中');

  console.log('=== 创建订单7: 保洁抢单（待抢单） ===');
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

  console.log('=== 创建订单8: 月嫂派单（已接单） ===');
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

  console.log('');
  console.log('=== 全部完成 ===');
  console.log('订单统计：');
  console.log('  待抢单：2');
  console.log('  已接单：3');
  console.log('  服务中：1');
  console.log('  已完成：1');
  console.log('  纠纷中：1');
  console.log('  总计：8单');
}

run().then(() => process.exit(0)).catch(() => process.exit(1));
