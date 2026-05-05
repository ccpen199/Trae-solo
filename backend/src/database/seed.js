require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = new Database(dbPath);

const testOrders = [
  {
    order_no: 'ORD202501010001',
    customer_name: '沃尔玛超市',
    customer_phone: '010-88880001',
    origin_address: '北京市海淀区中关村软件园',
    origin_lat: 40.0499,
    origin_lng: 116.2851,
    dest_address: '北京市朝阳区国贸中心',
    dest_lat: 39.9087,
    dest_lng: 116.4605,
    order_type: 'normal',
    priority: 1,
    status: 'transit',
    vehicle_id: 1,
    driver_id: 1,
    plan_departure_time: '2025-01-01 08:00:00',
    plan_arrival_time: '2025-01-01 12:00:00',
    total_fee: 1500.00,
    created_by: 1
  },
  {
    order_no: 'ORD202501010002',
    customer_name: '京东物流',
    customer_phone: '010-88880002',
    origin_address: '北京市通州区京东亚洲一号',
    origin_lat: 39.9092,
    origin_lng: 116.6496,
    dest_address: '北京市大兴区亦庄经济开发区',
    dest_lat: 39.7858,
    dest_lng: 116.5031,
    order_type: 'urgent',
    priority: 2,
    status: 'loading',
    vehicle_id: 2,
    driver_id: 2,
    plan_departure_time: '2025-01-01 10:00:00',
    plan_arrival_time: '2025-01-01 14:00:00',
    total_fee: 2200.00,
    created_by: 1
  },
  {
    order_no: 'ORD202501010003',
    customer_name: '顺丰速运',
    customer_phone: '010-88880003',
    origin_address: '北京市顺义区首都机场',
    origin_lat: 40.0799,
    origin_lng: 116.6031,
    dest_address: '北京市西城区金融街',
    dest_lat: 39.9128,
    dest_lng: 116.3594,
    order_type: 'cold',
    priority: 3,
    status: 'reviewed',
    total_fee: 3500.00,
    created_by: 1
  }
];

const testCargo = [
  { order_id: 1, cargo_name: '生鲜蔬菜', cargo_type: 'cold', weight: 2000, volume: 8, quantity: 50, packaging: '冷链箱' },
  { order_id: 1, cargo_name: '水果', cargo_type: 'normal', weight: 1000, volume: 5, quantity: 30, packaging: '纸箱' },
  { order_id: 2, cargo_name: '电子产品', cargo_type: 'fragile', weight: 500, volume: 3, quantity: 100, packaging: '防摔包装', special_requirements: '轻拿轻放' },
  { order_id: 3, cargo_name: '医疗试剂', cargo_type: 'cold', weight: 200, volume: 1, quantity: 20, packaging: '冷链运输箱', special_requirements: '全程2-8度冷藏' }
];

const generateTrackPoints = (startLat, startLng, endLat, endLng, vehicleId, orderId, numPoints = 20) => {
  const points = [];
  const latStep = (endLat - startLat) / numPoints;
  const lngStep = (endLng - startLng) / numPoints;
  
  for (let i = 0; i <= numPoints; i++) {
    const progress = i / numPoints;
    const lat = startLat + latStep * i + (Math.random() - 0.5) * 0.005;
    const lng = startLng + lngStep * i + (Math.random() - 0.5) * 0.005;
    
    points.push({
      vehicle_id: vehicleId,
      order_id: orderId,
      lat: lat,
      lng: lng,
      address: `位置点 ${i + 1}`,
      speed: Math.floor(40 + Math.random() * 40),
      direction: ['东北', '东', '东南', '南', '西南', '西', '西北', '北'][Math.floor(Math.random() * 8)],
      altitude: Math.floor(30 + Math.random() * 50),
      door_status: i === 0 ? 1 : 0,
      light_status: 0,
      cargo_door_status: i === 0 ? 1 : 0,
      current_load: 3000
    });
  }
  
  return points;
};

db.exec('BEGIN TRANSACTION');

try {
  const insertOrder = db.prepare(`
    INSERT OR IGNORE INTO orders (
      order_no, customer_name, customer_phone, origin_address, origin_lat, origin_lng,
      dest_address, dest_lat, dest_lng, order_type, priority, status,
      vehicle_id, driver_id, plan_departure_time, plan_arrival_time, total_fee, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  testOrders.forEach(order => {
    insertOrder.run(
      order.order_no, order.customer_name, order.customer_phone,
      order.origin_address, order.origin_lat, order.origin_lng,
      order.dest_address, order.dest_lat, order.dest_lng,
      order.order_type, order.priority, order.status,
      order.vehicle_id, order.driver_id,
      order.plan_departure_time, order.plan_arrival_time,
      order.total_fee, order.created_by
    );
  });

  const insertCargo = db.prepare(`
    INSERT OR IGNORE INTO cargo (
      order_id, cargo_name, cargo_type, weight, volume, quantity, packaging, special_requirements
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  testCargo.forEach(cargo => {
    insertCargo.run(
      cargo.order_id, cargo.cargo_name, cargo.cargo_type,
      cargo.weight, cargo.volume, cargo.quantity,
      cargo.packaging, cargo.special_requirements
    );
  });

  const vehiclePositions = [
    { id: 1, lat: 40.0000, lng: 116.3800, address: '北京市海淀区北四环中路', speed: 55, direction: '东南', last_report_time: '2025-01-01 10:30:00' },
    { id: 2, lat: 39.9200, lng: 116.4800, address: '北京市朝阳区建国路', speed: 0, direction: null, last_report_time: '2025-01-01 10:25:00' },
    { id: 3, lat: 39.9092, lng: 116.6496, address: '北京市通州区京东亚洲一号', speed: 0, direction: null, last_report_time: null },
    { id: 4, lat: 39.9042, lng: 116.4074, address: '北京市东城区天安门附近', speed: 35, direction: '东', last_report_time: '2025-01-01 10:28:00' }
  ];

  const updateVehicle = db.prepare(`
    UPDATE vehicles SET 
      current_lat = ?, current_lng = ?, current_address = ?,
      speed = ?, direction = ?, last_report_time = ?
    WHERE id = ?
  `);

  vehiclePositions.forEach(v => {
    updateVehicle.run(v.lat, v.lng, v.address, v.speed, v.direction, v.last_report_time, v.id);
  });

  const insertTrack = db.prepare(`
    INSERT OR IGNORE INTO gps_tracks (
      vehicle_id, order_id, lat, lng, address, speed, direction, altitude,
      door_status, light_status, cargo_door_status, current_load, report_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' minutes'))
  `);

  const track1 = generateTrackPoints(
    40.0499, 116.2851,
    40.0000, 116.3800,
    1, 1, 15
  );
  track1.forEach((point, idx) => {
    insertTrack.run(
      point.vehicle_id, point.order_id, point.lat, point.lng, point.address,
      point.speed, point.direction, point.altitude,
      point.door_status, point.light_status, point.cargo_door_status, point.current_load,
      (15 - idx) * 2
    );
  });

  const track2 = generateTrackPoints(
    39.9092, 116.6496,
    39.9200, 116.4800,
    2, 2, 8
  );
  track2.forEach((point, idx) => {
    insertTrack.run(
      point.vehicle_id, point.order_id, point.lat, point.lng, point.address,
      point.speed, point.direction, point.altitude,
      point.door_status, point.light_status, point.cargo_door_status, point.current_load,
      (8 - idx) * 5
    );
  });

  db.exec('COMMIT');

  console.log('========================================');
  console.log('数据填充完成！');
  console.log('========================================');
  console.log('');
  console.log('📋 测试订单：');
  console.log('  - ORD202501010001: 沃尔玛超市 运输中 (中关村 → 国贸)');
  console.log('  - ORD202501010002: 京东物流 装货中 (通州 → 亦庄)');
  console.log('  - ORD202501010003: 顺丰速运 已审核 (机场 → 金融街)');
  console.log('');
  console.log('🚗 车辆位置：');
  console.log('  - 京A12345: 海淀区北四环中路 (运输中, 55km/h)');
  console.log('  - 京B23456: 朝阳区建国路 (装货中, 0km/h)');
  console.log('  - 京C34567: 通州区京东亚洲一号 (空闲)');
  console.log('  - 京D45678: 东城区天安门附近 (运输中, 35km/h)');
  console.log('');
  console.log('📍 GPS轨迹：');
  console.log('  - 订单ORD202501010001: 16个轨迹点');
  console.log('  - 订单ORD202501010002: 9个轨迹点');
  console.log('');
  console.log('🌐 地图功能测试建议：');
  console.log('  1. 车辆监控页面: 查看实时车辆位置和状态');
  console.log('  2. 轨迹查询页面: 按订单号ORD202501010001查询轨迹');
  console.log('  3. 订单详情页面: 查看订单ORD202501010001的路线地图');
  console.log('');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('数据填充失败:', error.message);
  throw error;
}

db.close();
