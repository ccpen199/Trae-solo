const db = require('./src/models/database');
const dayjs = require('dayjs');

const generateOrderNo = () => 'ORD' + Date.now().toString() + Math.random().toString(36).substr(2, 4).toUpperCase();

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

console.log('开始生成测试数据...');

const plates = ['京A12345', '京B67890', '沪C11111', '粤D22222', '苏E33333', '浙F44444', '川A55555', '鲁B66666'];
const userIds = [1, 2];
const stations = [
  { id: 1, spots: [1, 2, 3, 4, 5], guns: [1, 2, 3, 4, 5], spotPrice: 8, gunPrice: 7 },
  { id: 2, spots: [101, 102, 103, 104, 105], guns: [21, 22, 23, 24, 25], spotPrice: 10, gunPrice: 11 }
];

const insertParking = db.prepare(`
  INSERT INTO parking_orders 
  (order_no, user_id, station_id, spot_id, plate_number, enter_time, exit_time, duration, amount, discount, actual_amount, status, paid_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertCharging = db.prepare(`
  INSERT INTO charging_orders
  (order_no, user_id, station_id, gun_id, start_time, end_time, duration, energy, start_soc, end_soc, amount, discount, actual_amount, status, paid_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertCombined = db.prepare(`
  INSERT INTO combined_orders
  (order_no, user_id, parking_order_id, charging_order_id, total_amount, total_discount, actual_amount, status, paid_at, payment_method, member_benefit, overtime_fee, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertAlert = db.prepare(`
  INSERT INTO alerts
  (station_id, device_id, device_name, alert_type, alert_level, message, is_resolved, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertWorkOrder = db.prepare(`
  INSERT INTO work_orders
  (title, type, station_id, device_id, priority, status, assignee, description, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertDeviceLog = db.prepare(`
  INSERT INTO device_logs
  (device_id, action, old_status, new_status, description, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

let now = dayjs();
let totalParking = 0, totalCharging = 0, totalCombined = 0;
let totalAlerts = 0, totalWorkOrders = 0, totalLogs = 0;

const statuses = ['paid', 'completed', 'cancelled'];
const priorities = ['high', 'medium', 'low'];
const alertTypes = ['离线告警', '故障告警', '通信异常', '电压异常', '温度过高'];
const alertLevels = ['critical', 'warning', 'info'];
const workOrderTypes = ['repair', 'maintenance', 'emergency', 'alert'];
const deviceTypes = ['gate', 'camera', 'sensor', 'lock', 'charger'];

for (let dayOffset = 7; dayOffset >= 0; dayOffset--) {
  const day = now.subtract(dayOffset, 'day');
  const ordersPerDay = Math.floor(Math.random() * 8) + 5;
  
  for (let i = 0; i < ordersPerDay; i++) {
    const station = getRandom(stations);
    const spot = getRandom(station.spots);
    const plate = getRandom(plates);
    const userId = getRandom(userIds);
    const isCharging = Math.random() > 0.4;
    
    const enterHour = Math.floor(Math.random() * 14) + 7;
    const durationMinutes = Math.floor(Math.random() * 180) + 30;
    const overtimeMinutes = durationMinutes > 120 ? durationMinutes - 120 : 0;
    const overtimeFee = overtimeMinutes > 0 ? Math.ceil(overtimeMinutes / 60) * 20 : 0;
    
    const enterTime = day.hour(enterHour).minute(Math.floor(Math.random() * 60)).second(0);
    const exitTime = enterTime.add(durationMinutes, 'minute');
    const parkingAmount = Math.ceil(durationMinutes / 60) * station.spotPrice;
    const discount = Math.random() > 0.7 ? Math.floor(parkingAmount * 0.2) : 0;
    const actualParkingAmount = parkingAmount - discount;
    
    const status = dayOffset === 0 && i >= ordersPerDay - 2 ? 'parking' : getRandom(statuses);
    const paidAt = status === 'paid' || status === 'completed' ? exitTime.toISOString() : null;
    
    const parkingOrderId = insertParking.run(
      generateOrderNo(), userId, station.id, spot, plate,
      enterTime.toISOString(),
      status === 'parking' ? null : exitTime.toISOString(),
      status === 'parking' ? null : durationMinutes,
      status === 'parking' ? null : parkingAmount.toFixed(2),
      status === 'parking' ? null : discount,
      status === 'parking' ? null : actualParkingAmount.toFixed(2),
      status, paidAt, enterTime.toISOString()
    ).lastInsertRowid;
    
    totalParking++;
    
    if (isCharging) {
      const gun = getRandom(station.guns);
      const chargeDuration = Math.floor(Math.random() * 120) + 20;
      const energy = (chargeDuration / 60) * 7;
      const chargeAmount = (energy * 1.5).toFixed(2);
      const chargeDiscount = Math.random() > 0.7 ? (chargeAmount * 0.1).toFixed(2) : '0.00';
      const actualChargeAmount = (chargeAmount - chargeDiscount).toFixed(2);
      const chargeStatus = status === 'parking' ? 'charging' : 'completed';
      const chargePaidAt = chargeStatus === 'completed' ? exitTime.toISOString() : null;
      
      const chargingOrderId = insertCharging.run(
        generateOrderNo(), userId, station.id, gun,
        enterTime.add(Math.floor(Math.random() * 10), 'minute').toISOString(),
        chargeStatus === 'charging' ? null : enterTime.add(chargeDuration, 'minute').toISOString(),
        chargeStatus === 'charging' ? null : chargeDuration,
        chargeStatus === 'charging' ? null : energy.toFixed(2),
        20, 85,
        chargeStatus === 'charging' ? null : chargeAmount,
        chargeStatus === 'charging' ? null : chargeDiscount,
        chargeStatus === 'charging' ? null : actualChargeAmount,
        chargeStatus, chargePaidAt, enterTime.toISOString()
      ).lastInsertRowid;
      
      totalCharging++;
      
      if ((status === 'paid' || status === 'completed') && chargeStatus === 'completed') {
        const totalAmt = parseFloat(actualParkingAmount) + parseFloat(actualChargeAmount);
        const totalDisc = parseFloat(discount) + parseFloat(chargeDiscount);
        const memberBenefit = Math.random() > 0.6 ? '会员9折' : (Math.random() > 0.5 ? '充电免停1小时' : '无');
        
        insertCombined.run(
          generateOrderNo(), userId, parkingOrderId, chargingOrderId,
          (totalAmt + totalDisc).toFixed(2),
          totalDisc.toFixed(2),
          totalAmt.toFixed(2),
          'paid', exitTime.add(5, 'minute').toISOString(),
          getRandom(['wechat', 'alipay', 'balance']),
          memberBenefit,
          overtimeFee.toFixed(2),
          exitTime.add(5, 'minute').toISOString()
        );
        totalCombined++;
      }
    }
  }
}

const devices = db.prepare('SELECT id, device_name, device_type, status FROM devices').all();
const deviceStatuses = ['online', 'offline', 'fault'];

devices.forEach(device => {
  const actions = ['设备上线', '设备离线', '状态变更', '自动恢复', '手动重启'];
  for (let i = 0; i < 5; i++) {
    const oldStatus = getRandom(deviceStatuses);
    const newStatus = getRandom(deviceStatuses);
    insertDeviceLog.run(
      device.id, getRandom(actions), oldStatus, newStatus,
      `${device.device_name} 状态从 ${oldStatus} 变为 ${newStatus}`,
      now.subtract(Math.floor(Math.random() * 7), 'day').toISOString()
    );
    totalLogs++;
  }
  
  if (Math.random() > 0.5) {
    const alertLevel = getRandom(alertLevels);
    const alertType = getRandom(alertTypes);
    const resolved = Math.random() > 0.6 ? 1 : 0;
    const alertId = insertAlert.run(
      device.id > 7 ? 2 : 1, device.id, device.device_name,
      alertType, alertLevel,
      `${device.device_name} 发生${alertType}`,
      resolved,
      now.subtract(Math.floor(Math.random() * 3), 'day').toISOString()
    ).lastInsertRowid;
    totalAlerts++;
    
    if (!resolved || Math.random() > 0.7) {
      const woStatus = resolved ? 'completed' : getRandom(['pending', 'processing']);
      insertWorkOrder.run(
        `${device.device_name} - ${alertType}`,
        'alert',
        device.id > 7 ? 2 : 1,
        device.id,
        alertLevel === 'critical' ? 'high' : (alertLevel === 'warning' ? 'medium' : 'low'),
        woStatus,
        '张运维',
        `设备告警处理：${alertType}`,
        now.subtract(Math.floor(Math.random() * 2), 'day').toISOString()
      );
      totalWorkOrders++;
    }
  }
});

for (let i = 0; i < 8; i++) {
  insertWorkOrder.run(
    getRandom(['道闸日常维护', '摄像头校准', '传感器检修', '充电桩检测', '地锁保养']),
    getRandom(workOrderTypes),
    getRandom([1, 2]),
    null,
    getRandom(priorities),
    getRandom(['pending', 'processing', 'completed']),
    '李运维',
    '定期维护',
    now.subtract(Math.floor(Math.random() * 5), 'day').toISOString()
  );
  totalWorkOrders++;
}

console.log(`✅ 测试数据生成完成：`);
console.log(`   停车订单: ${totalParking} 条`);
console.log(`   充电订单: ${totalCharging} 条`);
console.log(`   合并支付订单: ${totalCombined} 条`);
console.log(`   设备告警: ${totalAlerts} 条`);
console.log(`   工单: ${totalWorkOrders} 条`);
console.log(`   设备状态流转记录: ${totalLogs} 条`);

const today = now.format('YYYY-MM-DD');
const todayParking = db.prepare(`
  SELECT COALESCE(SUM(actual_amount), 0) as total FROM parking_orders WHERE DATE(created_at) = ? AND status = 'paid'
`).get(today).total;
const todayCharging = db.prepare(`
  SELECT COALESCE(SUM(actual_amount), 0) as total FROM charging_orders WHERE DATE(created_at) = ? AND status = 'paid'
`).get(today).total;
const pendingWO = db.prepare(`SELECT COUNT(*) as c FROM work_orders WHERE status = 'pending'`).get().c;
const activeAlerts = db.prepare(`SELECT COUNT(*) as c FROM alerts WHERE is_resolved = 0`).get().c;

console.log(`\n📊 当前统计：`);
console.log(`   今日停车收入: ¥${todayParking}`);
console.log(`   今日充电收入: ¥${todayCharging}`);
console.log(`   今日总收入: ¥${(todayParking + todayCharging).toFixed(2)}`);
console.log(`   待处理工单: ${pendingWO}`);
console.log(`   未处理告警: ${activeAlerts}`);
