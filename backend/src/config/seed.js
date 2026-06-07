const { Engineer, Fault, EngineerSkill, Part, UsedDevice, Order } = require('../models');
const { generateOrderNo } = require('../utils/hash');

async function seedDatabase() {
  console.log('开始初始化数据库...');

  const faults = await Fault.bulkCreate([
    {
      code: 'BAT001',
      name: '电池老化损坏',
      description: '电池健康度低于80%，续航时间短，充电速度慢或无法充电',
      device_type: 'smartphone',
      symptoms: JSON.stringify(['耗电快', '续航短', '电池鼓包', '自动关机', '无法充电']),
      estimated_hours: 0.5,
      estimated_cost: 199,
      solution: '1. 拆机检查电池状态\n2. 拆卸旧电池\n3. 安装新电池并测试\n4. 密封后盖',
      difficulty: 2
    },
    {
      code: 'SCR001',
      name: '屏幕碎裂更换',
      description: '外屏玻璃碎裂，显示和触摸正常',
      device_type: 'smartphone',
      symptoms: JSON.stringify(['屏幕碎', '玻璃裂', '显示正常', '触摸正常']),
      estimated_hours: 1.0,
      estimated_cost: 399,
      solution: '1. 加热屏幕边缘\n2. 分离碎屏\n3. 清理残胶\n4. 安装新屏幕总成\n5. 测试显示触摸',
      difficulty: 3
    },
    {
      code: 'SCR002',
      name: '屏幕显示异常',
      description: '屏幕不显示、显示花屏、线条、色斑等问题',
      device_type: 'smartphone',
      symptoms: JSON.stringify(['黑屏', '花屏', '线条', '色斑', '不显示']),
      estimated_hours: 1.0,
      estimated_cost: 599,
      solution: '1. 检查排线连接\n2. 测试屏幕总成\n3. 更换屏幕总成',
      difficulty: 3
    },
    {
      code: 'CHG001',
      name: '充电接口损坏',
      description: '充电口松动、接触不良、无法充电',
      device_type: 'smartphone',
      symptoms: JSON.stringify(['充电慢', '充不进电', '接口松动', '接触不良']),
      estimated_hours: 0.8,
      estimated_cost: 159,
      solution: '1. 拆机检查尾插\n2. 更换尾插排线\n3. 测试充电功能',
      difficulty: 2
    },
    {
      code: 'CAM001',
      name: '摄像头故障',
      description: '前后置摄像头无法打开、拍照模糊、黑斑',
      device_type: 'smartphone',
      symptoms: JSON.stringify(['无法打开', '拍照模糊', '黑斑', '摄像头故障']),
      estimated_hours: 0.6,
      estimated_cost: 299,
      solution: '1. 检查摄像头连接\n2. 更换摄像头模块\n3. 测试拍照功能',
      difficulty: 2
    },
    {
      code: 'BRD001',
      name: '主板电源IC损坏',
      description: '无法开机、充电无反应、反复重启',
      device_type: 'smartphone',
      symptoms: JSON.stringify(['不开机', '无反应', '反复重启', '充电没反应']),
      estimated_hours: 2.0,
      estimated_cost: 499,
      solution: '1. 检测主板供电\n2. 更换电源IC芯片\n3. 装机测试',
      difficulty: 5
    },
    {
      code: 'SPK001',
      name: '扬声器/听筒故障',
      description: '无声音、声音小、杂音、破音',
      device_type: 'smartphone',
      symptoms: JSON.stringify(['没声音', '声音小', '杂音', '破音', '听筒坏']),
      estimated_hours: 0.5,
      estimated_cost: 129,
      solution: '1. 检测音频排线\n2. 更换扬声器/听筒\n3. 测试音频功能',
      difficulty: 2
    },
    {
      code: 'BAT002',
      name: '笔记本电池更换',
      description: '笔记本电池不充电、续航短、鼓包',
      device_type: 'laptop',
      symptoms: JSON.stringify(['电池不充电', '续航短', '电池鼓包']),
      estimated_hours: 0.3,
      estimated_cost: 399,
      solution: '1. 拆卸后盖\n2. 更换电池\n3. 测试充电',
      difficulty: 1
    }
  ]);

  console.log('已创建故障数据:', faults.length);

  const engineers = await Engineer.bulkCreate([
    {
      name: '张伟',
      phone: '13800138001',
      id_card: '310101199001010001',
      certificate_no: 'CER202401001',
      certificate_level: 3,
      service_radius: 15,
      success_rate: 96.5,
      equipment_id: 'EQP-001',
      lat: 31.2304,
      lng: 121.4737,
      status: 1,
      total_orders: 156,
      avg_rating: 4.9
    },
    {
      name: '李强',
      phone: '13800138002',
      id_card: '310101199202020002',
      certificate_no: 'CER202401002',
      certificate_level: 2,
      service_radius: 10,
      success_rate: 94.2,
      equipment_id: 'EQP-002',
      lat: 31.2204,
      lng: 121.4837,
      status: 1,
      total_orders: 89,
      avg_rating: 4.7
    },
    {
      name: '王芳',
      phone: '13800138003',
      id_card: '310101199503030003',
      certificate_no: 'CER202401003',
      certificate_level: 4,
      service_radius: 20,
      success_rate: 98.3,
      equipment_id: 'EQP-003',
      lat: 31.2404,
      lng: 121.4637,
      status: 1,
      total_orders: 234,
      avg_rating: 4.95
    },
    {
      name: '刘洋',
      phone: '13800138004',
      id_card: '310101198804040004',
      certificate_no: 'CER202401004',
      certificate_level: 5,
      service_radius: 25,
      success_rate: 99.1,
      equipment_id: 'EQP-004',
      lat: 31.2104,
      lng: 121.4537,
      status: 2,
      total_orders: 412,
      avg_rating: 4.98
    },
    {
      name: '陈静',
      phone: '13800138005',
      id_card: '310101199305050005',
      certificate_no: 'CER202401005',
      certificate_level: 2,
      service_radius: 8,
      success_rate: 92.8,
      equipment_id: 'EQP-005',
      lat: 31.2504,
      lng: 121.4937,
      status: 1,
      total_orders: 67,
      avg_rating: 4.6
    }
  ]);

  console.log('已创建工程师数据:', engineers.length);

  await EngineerSkill.bulkCreate([
    { engineer_id: 1, fault_code: 'BAT001', proficiency: 5 },
    { engineer_id: 1, fault_code: 'SCR001', proficiency: 4 },
    { engineer_id: 1, fault_code: 'CHG001', proficiency: 5 },
    { engineer_id: 1, fault_code: 'SPK001', proficiency: 4 },
    { engineer_id: 2, fault_code: 'BAT001', proficiency: 4 },
    { engineer_id: 2, fault_code: 'CAM001', proficiency: 4 },
    { engineer_id: 2, fault_code: 'CHG001', proficiency: 3 },
    { engineer_id: 3, fault_code: 'BAT001', proficiency: 5 },
    { engineer_id: 3, fault_code: 'SCR001', proficiency: 5 },
    { engineer_id: 3, fault_code: 'SCR002', proficiency: 5 },
    { engineer_id: 3, fault_code: 'BRD001', proficiency: 4 },
    { engineer_id: 4, fault_code: 'BRD001', proficiency: 5 },
    { engineer_id: 4, fault_code: 'SCR002', proficiency: 5 },
    { engineer_id: 4, fault_code: 'BAT002', proficiency: 5 },
    { engineer_id: 5, fault_code: 'SPK001', proficiency: 4 },
    { engineer_id: 5, fault_code: 'CAM001', proficiency: 3 }
  ]);

  console.log('已创建工程师技能数据');

  await Part.bulkCreate([
    { sku: 'BAT-IPH-001', name: 'iPhone 13 原装电池', category: 'battery', quantity: 50, price: 199, is_original: true, trace_code_prefix: 'APL', min_stock: 20 },
    { sku: 'SCR-IPH-001', name: 'iPhone 13 屏幕总成', category: 'screen', quantity: 25, price: 599, is_original: true, trace_code_prefix: 'APL', min_stock: 10 },
    { sku: 'CHG-UNI-001', name: 'Type-C 尾插排线', category: 'charging', quantity: 100, price: 49, is_original: false, trace_code_prefix: 'THD', min_stock: 50 },
    { sku: 'CAM-IPH-001', name: 'iPhone 后置摄像头', category: 'camera', quantity: 15, price: 289, is_original: true, trace_code_prefix: 'APL', min_stock: 8 },
    { sku: 'BAT-MAC-001', name: 'MacBook Pro 电池', category: 'battery', quantity: 8, price: 599, is_original: true, trace_code_prefix: 'APL', min_stock: 5 },
    { sku: 'SPK-IPH-001', name: 'iPhone 扬声器', category: 'audio', quantity: 60, price: 79, is_original: false, trace_code_prefix: 'THD', min_stock: 30 },
    { sku: 'SCR-SAM-001', name: '三星 S22 屏幕', category: 'screen', quantity: 12, price: 799, is_original: true, trace_code_prefix: 'SAM', min_stock: 5 },
    { sku: 'BAT-AND-001', name: '安卓通用电池', category: 'battery', quantity: 5, price: 129, is_original: false, trace_code_prefix: 'THD', min_stock: 30 }
  ]);

  console.log('已创建配件数据');

  await UsedDevice.bulkCreate([
    {
      device_model: 'iPhone 12 Pro 256G',
      imei: '356789012345678',
      purchase_price: 2800,
      appearance_rating: 4,
      ocr_report: JSON.stringify({ screen: '完美', body: '轻微划痕', battery: '85%' }),
      valuation_params: JSON.stringify({ age: 1.5, condition: 0.9, market: 3200 }),
      refurbishment_log: JSON.stringify([{ process: '清洁', time: '2024-01-15' }]),
      estimated_value: 3500,
      status: 1
    },
    {
      device_model: '华为 Mate 40 Pro',
      imei: '867890123456789',
      purchase_price: 1800,
      appearance_rating: 3,
      ocr_report: JSON.stringify({ screen: '轻微划痕', body: '正常使用', battery: '78%' }),
      valuation_params: JSON.stringify({ age: 2, condition: 0.8, market: 2100 }),
      refurbishment_log: JSON.stringify([{ process: '电池更换', time: '2024-01-10' }]),
      estimated_value: 2300,
      status: 2
    }
  ]);

  console.log('已创建二手机数据');

  const now = new Date();
  const ordersData = [];
  
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const orderDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const statuses = [0, 1, 2, 3, 4, 5];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    ordersData.push({
      order_no: generateOrderNo(),
      user_name: `用户${i + 1}`,
      user_phone: `1390000${(1000 + i).toString().slice(-4)}`,
      user_address: `上海市浦东新区测试路${i + 1}号`,
      user_lat: 31.2304 + (Math.random() - 0.5) * 0.1,
      user_lng: 121.4737 + (Math.random() - 0.5) * 0.1,
      device_type: ['smartphone', 'laptop', 'tablet'][Math.floor(Math.random() * 3)],
      device_model: ['iPhone 13', 'iPhone 12', '华为 Mate 40', 'MacBook Pro'][Math.floor(Math.random() * 4)],
      fault_description: ['屏幕碎了', '电池不耐用', '充电没反应', '不开机'][Math.floor(Math.random() * 4)],
      predicted_faults: JSON.stringify([
        { code: 'BAT001', name: '电池损坏', confidence: 0.85 },
        { code: 'CHG001', name: '充电口故障', confidence: 0.65 }
      ]),
      prediction_accuracy: 75 + Math.random() * 20,
      actual_fault_code: ['BAT001', 'SCR001', 'CHG001', 'BRD001'][Math.floor(Math.random() * 4)],
      engineer_id: engineers[Math.floor(Math.random() * engineers.length)].id,
      status,
      total_cost: 100 + Math.floor(Math.random() * 500),
      rating: status === 5 ? Math.floor(Math.random() * 2) + 4 : null,
      created_at: orderDate
    });
  }
  
  await Order.bulkCreate(ordersData);
  console.log('已创建订单数据:', ordersData.length);

  console.log('数据库初始化完成！');
}

module.exports = seedDatabase;
