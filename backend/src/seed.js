import { db, initDB } from './db.js';

function daysAgo(n, time) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  if (time) {
    return d.toISOString().slice(0, 10) + ' ' + time;
  }
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function minutesAgo(m) {
  const d = new Date();
  d.setTime(d.getTime() - m * 60000);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function seed() {
  initDB();

  const stations = [
    { id: 1, name: '朝阳换电站', address: '北京市朝阳区建国路88号', status: 'online', total_slots: 8, available_count: 3, charging_count: 3, abnormal_count: 1, current_wait_minutes: 15 },
    { id: 2, name: '海淀换电站', address: '北京市海淀区中关村大街66号', status: 'maintenance', total_slots: 8, available_count: 2, charging_count: 2, abnormal_count: 2, current_wait_minutes: 30 },
  ];

  const insertStation = db.prepare(`
    INSERT OR IGNORE INTO stations (id, name, address, status, total_slots, available_count, charging_count, abnormal_count, current_wait_minutes, created_at, updated_at)
    VALUES (@id, @name, @address, @status, @total_slots, @available_count, @charging_count, @abnormal_count, @current_wait_minutes, @created_at, @updated_at)
  `);

  for (const s of stations) {
    insertStation.run({ ...s, created_at: daysAgo(25), updated_at: daysAgo(0) });
  }

  const batteries = [
    { id: 1, battery_code: 'BAT-2024-A001', model: '宁德时代-72V100Ah', soc: 95, soh: 98, cycle_count: 120, temperature: 28.5, voltage: 73.2, fault_code: null, status: 'available', station_id: 1, last_maintenance_date: daysAgo(10) },
    { id: 2, battery_code: 'BAT-2024-A002', model: '宁德时代-72V100Ah', soc: 45, soh: 96, cycle_count: 200, temperature: 35.2, voltage: 68.5, fault_code: null, status: 'charging', station_id: 1, last_maintenance_date: daysAgo(15) },
    { id: 3, battery_code: 'BAT-2024-A003', model: '比亚迪-72V80Ah', soc: 88, soh: 95, cycle_count: 300, temperature: 27.1, voltage: 72.8, fault_code: null, status: 'available', station_id: 1, last_maintenance_date: daysAgo(8) },
    { id: 4, battery_code: 'BAT-2024-A004', model: '宁德时代-72V100Ah', soc: 60, soh: 92, cycle_count: 450, temperature: 42.8, voltage: 70.1, fault_code: 'ERR-T01', status: 'abnormal', station_id: 1, last_maintenance_date: daysAgo(20) },
    { id: 5, battery_code: 'BAT-2024-A005', model: '比亚迪-72V80Ah', soc: 30, soh: 88, cycle_count: 500, temperature: 33.6, voltage: 65.4, fault_code: null, status: 'charging', station_id: 1, last_maintenance_date: daysAgo(5) },
    { id: 6, battery_code: 'BAT-2024-A006', model: '宁德时代-72V100Ah', soc: 75, soh: 85, cycle_count: 600, temperature: 29.0, voltage: 71.0, fault_code: null, status: 'in_use', station_id: 1, last_maintenance_date: daysAgo(3) },
    { id: 7, battery_code: 'BAT-2024-B001', model: '宁德时代-72V100Ah', soc: 92, soh: 97, cycle_count: 80, temperature: 26.3, voltage: 73.0, fault_code: null, status: 'available', station_id: 2, last_maintenance_date: daysAgo(12) },
    { id: 8, battery_code: 'BAT-2024-B002', model: '比亚迪-72V80Ah', soc: 55, soh: 93, cycle_count: 350, temperature: 36.5, voltage: 69.2, fault_code: null, status: 'charging', station_id: 2, last_maintenance_date: daysAgo(7) },
    { id: 9, battery_code: 'BAT-2024-B003', model: '宁德时代-72V100Ah', soc: 10, soh: 78, cycle_count: 800, temperature: 45.0, voltage: 60.2, fault_code: 'ERR-T03', status: 'abnormal', station_id: 2, last_maintenance_date: daysAgo(25) },
    { id: 10, battery_code: 'BAT-2024-B004', model: '比亚迪-72V80Ah', soc: 82, soh: 91, cycle_count: 400, temperature: 27.8, voltage: 72.1, fault_code: null, status: 'available', station_id: 2, last_maintenance_date: daysAgo(9) },
    { id: 11, battery_code: 'BAT-2024-B005', model: '宁德时代-72V100Ah', soc: 50, soh: 70, cycle_count: 900, temperature: 30.0, voltage: 68.0, fault_code: 'ERR-S01', status: 'maintenance', station_id: 2, last_maintenance_date: daysAgo(2) },
    { id: 12, battery_code: 'BAT-2024-B006', model: '比亚迪-72V80Ah', soc: 38, soh: 94, cycle_count: 250, temperature: 34.1, voltage: 67.8, fault_code: null, status: 'charging', station_id: 2, last_maintenance_date: daysAgo(14) },
  ];

  const insertBattery = db.prepare(`
    INSERT OR IGNORE INTO batteries (id, battery_code, model, soc, soh, cycle_count, temperature, voltage, fault_code, status, station_id, last_maintenance_date, created_at, updated_at)
    VALUES (@id, @battery_code, @model, @soc, @soh, @cycle_count, @temperature, @voltage, @fault_code, @status, @station_id, @last_maintenance_date, @created_at, @updated_at)
  `);

  for (const b of batteries) {
    insertBattery.run({ ...b, created_at: daysAgo(20), updated_at: daysAgo(1) });
  }

  const cabinetSlots = [
    { id: 1, station_id: 1, slot_number: 1, status: 'available', battery_id: 1 },
    { id: 2, station_id: 1, slot_number: 2, status: 'charging', battery_id: 2 },
    { id: 3, station_id: 1, slot_number: 3, status: 'available', battery_id: 3 },
    { id: 4, station_id: 1, slot_number: 4, status: 'fault', battery_id: 4 },
    { id: 5, station_id: 1, slot_number: 5, status: 'charging', battery_id: 5 },
    { id: 6, station_id: 2, slot_number: 1, status: 'available', battery_id: 7 },
    { id: 7, station_id: 2, slot_number: 2, status: 'charging', battery_id: 8 },
    { id: 8, station_id: 2, slot_number: 3, status: 'available', battery_id: 10 },
  ];

  const insertSlot = db.prepare(`
    INSERT OR IGNORE INTO cabinet_slots (id, station_id, slot_number, status, battery_id, created_at, updated_at)
    VALUES (@id, @station_id, @slot_number, @status, @battery_id, @created_at, @updated_at)
  `);

  for (const s of cabinetSlots) {
    insertSlot.run({ ...s, created_at: daysAgo(20), updated_at: daysAgo(0) });
  }

  const vehicles = [
    { id: 1, plate_number: '京A12345', vin: 'LSVAU2180N2012345', brand: '北汽', model: 'EU5', owner_name: '张伟', owner_phone: '13800138001', member_type: 'gold', member_expire_date: daysAgo(-60) },
    { id: 2, plate_number: '京B67890', vin: 'LSVAU2180N2067890', brand: '比亚迪', model: '秦PLUS', owner_name: '李娜', owner_phone: '13800138002', member_type: 'platinum', member_expire_date: daysAgo(-120) },
    { id: 3, plate_number: '京C24680', vin: 'LSVAU2180N2024680', brand: '蔚来', model: 'ET5', owner_name: '王强', owner_phone: '13800138003', member_type: 'silver', member_expire_date: daysAgo(-30) },
    { id: 4, plate_number: '京D13579', vin: 'LSVAU2180N2013579', brand: '小鹏', model: 'P5', owner_name: '赵敏', owner_phone: '13800138004', member_type: 'none', member_expire_date: null },
    { id: 5, plate_number: '京E98765', vin: 'LSVAU2180N2098765', brand: '广汽埃安', model: 'AION S', owner_name: '陈刚', owner_phone: '13800138005', member_type: 'gold', member_expire_date: daysAgo(-90) },
    { id: 6, plate_number: '京F54321', vin: 'LSVAU2180N2054321', brand: '吉利', model: '帝豪EV', owner_name: '刘洋', owner_phone: '13800138006', member_type: 'silver', member_expire_date: daysAgo(5) },
  ];

  const insertVehicle = db.prepare(`
    INSERT OR IGNORE INTO vehicles (id, plate_number, vin, brand, model, owner_name, owner_phone, member_type, member_expire_date, created_at, updated_at)
    VALUES (@id, @plate_number, @vin, @brand, @model, @owner_name, @owner_phone, @member_type, @member_expire_date, @created_at, @updated_at)
  `);

  for (const v of vehicles) {
    insertVehicle.run({ ...v, created_at: daysAgo(18), updated_at: daysAgo(2) });
  }

  const swapOrders = [
    { id: 1, order_no: 'SW20240501001', station_id: 1, vehicle_id: 1, battery_out_id: 6, battery_in_id: 1, slot_number: 1, status: 'completed', swap_start_time: daysAgo(20, '09:15:00'), swap_end_time: daysAgo(20, '09:18:30'), fee: 60, discount_amount: 6, actual_fee: 54, member_benefit: '金卡9折', failure_reason: null, operator_id: 1 },
    { id: 2, order_no: 'SW20240501002', station_id: 1, vehicle_id: 2, battery_out_id: null, battery_in_id: 3, slot_number: 3, status: 'completed', swap_start_time: daysAgo(18, '10:30:00'), swap_end_time: daysAgo(18, '10:33:45'), fee: 60, discount_amount: 12, actual_fee: 48, member_benefit: '铂金8折', failure_reason: null, operator_id: 1 },
    { id: 3, order_no: 'SW20240502001', station_id: 1, vehicle_id: 3, battery_out_id: null, battery_in_id: null, slot_number: null, status: 'failed', swap_start_time: daysAgo(15, '14:00:00'), swap_end_time: null, fee: 0, discount_amount: 0, actual_fee: 0, member_benefit: null, failure_reason: '换电仓门异常无法打开', operator_id: 1 },
    { id: 4, order_no: 'SW20240502002', station_id: 2, vehicle_id: 4, battery_out_id: null, battery_in_id: 7, slot_number: 1, status: 'completed', swap_start_time: daysAgo(14, '11:20:00'), swap_end_time: daysAgo(14, '11:24:10'), fee: 60, discount_amount: 0, actual_fee: 60, member_benefit: null, failure_reason: null, operator_id: 2 },
    { id: 5, order_no: 'SW20240503001', station_id: 1, vehicle_id: 5, battery_out_id: null, battery_in_id: 1, slot_number: 1, status: 'completed', swap_start_time: daysAgo(12, '16:45:00'), swap_end_time: daysAgo(12, '16:48:55'), fee: 60, discount_amount: 6, actual_fee: 54, member_benefit: '金卡9折', failure_reason: null, operator_id: 1 },
    { id: 6, order_no: 'SW20240503002', station_id: 2, vehicle_id: 1, battery_out_id: null, battery_in_id: 10, slot_number: 3, status: 'completed', swap_start_time: daysAgo(10, '08:30:00'), swap_end_time: daysAgo(10, '08:33:20'), fee: 60, discount_amount: 6, actual_fee: 54, member_benefit: '金卡9折', failure_reason: null, operator_id: 2 },
    { id: 7, order_no: 'SW20240504001', station_id: 1, vehicle_id: 6, battery_out_id: null, battery_in_id: 3, slot_number: 3, status: 'completed', swap_start_time: daysAgo(8, '13:10:00'), swap_end_time: daysAgo(8, '13:14:30'), fee: 60, discount_amount: 3, actual_fee: 57, member_benefit: '银卡95折', failure_reason: null, operator_id: 1 },
    { id: 8, order_no: 'SW20240505001', station_id: 2, vehicle_id: 2, battery_out_id: null, battery_in_id: 7, slot_number: 1, status: 'completed', swap_start_time: daysAgo(7, '09:50:00'), swap_end_time: daysAgo(7, '09:53:15'), fee: 60, discount_amount: 12, actual_fee: 48, member_benefit: '铂金8折', failure_reason: null, operator_id: 2 },
    { id: 9, order_no: 'SW20240505002', station_id: 1, vehicle_id: 4, battery_out_id: null, battery_in_id: null, slot_number: null, status: 'failed', swap_start_time: daysAgo(6, '15:30:00'), swap_end_time: null, fee: 0, discount_amount: 0, actual_fee: 0, member_benefit: null, failure_reason: '电池锁止机构故障', operator_id: 1 },
    { id: 10, order_no: 'SW20240506001', station_id: 1, vehicle_id: 3, battery_out_id: null, battery_in_id: 1, slot_number: 1, status: 'completed', swap_start_time: daysAgo(5, '10:00:00'), swap_end_time: daysAgo(5, '10:03:40'), fee: 60, discount_amount: 3, actual_fee: 57, member_benefit: '银卡95折', failure_reason: null, operator_id: 1 },
    { id: 11, order_no: 'SW20240506002', station_id: 2, vehicle_id: 5, battery_out_id: null, battery_in_id: 10, slot_number: 3, status: 'swapping', swap_start_time: daysAgo(1, '17:20:00'), swap_end_time: null, fee: 60, discount_amount: 6, actual_fee: 54, member_benefit: '金卡9折', failure_reason: null, operator_id: 2 },
    { id: 12, order_no: 'SW20240507001', station_id: 1, vehicle_id: 6, battery_out_id: null, battery_in_id: 4, slot_number: 3, status: 'suspended', swap_start_time: null, swap_end_time: null, fee: 60, discount_amount: 0, actual_fee: 60, member_benefit: null, failure_reason: null, suspend_reason: '目标电池异常已锁止，暂停派柜等待安全处置', operator_id: 1 },
    { id: 13, order_no: 'SW20240507002', station_id: 1, vehicle_id: 1, battery_out_id: null, battery_in_id: null, slot_number: null, status: 'pending', swap_start_time: null, swap_end_time: null, fee: 60, discount_amount: 0, actual_fee: 60, member_benefit: null, failure_reason: null, operator_id: 1 },
    { id: 14, order_no: 'SW20240507003', station_id: 2, vehicle_id: 3, battery_out_id: null, battery_in_id: null, slot_number: null, status: 'failed', swap_start_time: daysAgo(2, '08:45:00'), swap_end_time: null, fee: 0, discount_amount: 0, actual_fee: 0, member_benefit: null, failure_reason: '换电设备通信超时', operator_id: 2 },
    { id: 15, order_no: 'SW20240507004', station_id: 1, vehicle_id: 2, battery_out_id: null, battery_in_id: 1, slot_number: 1, status: 'completed', swap_start_time: daysAgo(3, '11:05:00'), swap_end_time: daysAgo(3, '11:08:20'), fee: 60, discount_amount: 12, actual_fee: 48, member_benefit: '铂金8折', failure_reason: null, operator_id: 1 },
  ];

  const insertOrder = db.prepare(`
    INSERT OR IGNORE INTO swap_orders (id, order_no, station_id, vehicle_id, battery_out_id, battery_in_id, slot_number, status, swap_start_time, swap_end_time, fee, discount_amount, actual_fee, member_benefit, failure_reason, suspend_reason, operator_id, created_at, updated_at)
    VALUES (@id, @order_no, @station_id, @vehicle_id, @battery_out_id, @battery_in_id, @slot_number, @status, @swap_start_time, @swap_end_time, @fee, @discount_amount, @actual_fee, @member_benefit, @failure_reason, @suspend_reason, @operator_id, @created_at, @updated_at)
  `);

  for (const o of swapOrders) {
    insertOrder.run({ ...o, suspend_reason: o.suspend_reason || null, created_at: o.swap_start_time || daysAgo(1), updated_at: daysAgo(0) });
  }

  const reservations = [
    { id: 1, station_id: 1, vehicle_id: 1, plate_number: '京A12345', status: 'waiting', created_at: minutesAgo(5), updated_at: minutesAgo(5), action_by: null, action_at: null, action_note: null },
    { id: 2, station_id: 1, vehicle_id: 4, plate_number: '京D13579', status: 'waiting', created_at: minutesAgo(12), updated_at: minutesAgo(12), action_by: null, action_at: null, action_note: null },
    { id: 3, station_id: 1, vehicle_id: 6, plate_number: '京F54321', status: 'waiting', created_at: minutesAgo(18), updated_at: minutesAgo(18), action_by: null, action_at: null, action_note: null },
    { id: 4, station_id: 2, vehicle_id: 3, plate_number: '京C24680', status: 'waiting', created_at: minutesAgo(8), updated_at: minutesAgo(8), action_by: null, action_at: null, action_note: null },
    { id: 5, station_id: 1, vehicle_id: 5, plate_number: '京E98765', status: 'cancelled', created_at: minutesAgo(25), updated_at: minutesAgo(20), action_by: '值班员-张伟', action_at: minutesAgo(20), action_note: '车主要求取消，超时15分钟' },
    { id: 6, station_id: 1, vehicle_id: 2, plate_number: '京B67890', status: 'requeued', created_at: minutesAgo(30), updated_at: minutesAgo(10), action_by: '值班员-张伟', action_at: minutesAgo(10), action_note: '严重超时重新排队，原排位#1→队尾' },
  ];

  const insertReservation = db.prepare(`
    INSERT OR IGNORE INTO reservations (id, station_id, vehicle_id, plate_number, status, action_by, action_at, action_note, created_at, updated_at)
    VALUES (@id, @station_id, @vehicle_id, @plate_number, @status, @action_by, @action_at, @action_note, @created_at, @updated_at)
  `);

  for (const r of reservations) {
    insertReservation.run(r);
  }

  const safetyAlerts = [
    { id: 1, station_id: 1, battery_id: 4, alert_type: 'high_temperature', severity: 'high', description: '电池BAT-2024-A004温度超过42°C，触发热保护告警', status: 'processing' },
    { id: 2, station_id: 2, battery_id: 9, alert_type: 'high_temperature', severity: 'critical', description: '电池BAT-2024-B003温度达到45°C，存在热失控风险', status: 'open' },
    { id: 3, station_id: 1, battery_id: null, alert_type: 'door_anomaly', severity: 'medium', description: '3号换电仓门开启超时，自动锁定失败', status: 'resolved' },
    { id: 4, station_id: 2, battery_id: null, alert_type: 'swap_failure', severity: 'medium', description: '换电过程中通信超时，换电操作中断', status: 'processing' },
    { id: 5, station_id: 1, battery_id: 4, alert_type: 'leakage', severity: 'critical', description: '电池BAT-2024-A004检测到电解液泄漏', status: 'open' },
    { id: 6, station_id: 2, battery_id: null, alert_type: 'user_complaint', severity: 'low', description: '用户反馈换电等待时间过长，超过30分钟', status: 'resolved' },
  ];

  const insertAlert = db.prepare(`
    INSERT OR IGNORE INTO safety_alerts (id, station_id, battery_id, alert_type, severity, description, status, created_at, updated_at)
    VALUES (@id, @station_id, @battery_id, @alert_type, @severity, @description, @status, @created_at, @updated_at)
  `);

  for (const a of safetyAlerts) {
    insertAlert.run({ ...a, created_at: daysAgo(3), updated_at: daysAgo(1) });
  }

  const workOrders = [
    { id: 1, alert_id: 1, station_id: 1, battery_id: 4, type: 'inspection', status: 'in_progress', assigned_to: '技术员-李明', description: '对高温告警电池BAT-2024-A004进行全面检测', resolution: null },
    { id: 2, alert_id: 2, station_id: 2, battery_id: 9, type: 'replacement', status: 'pending', assigned_to: null, description: '更换热失控风险电池BAT-2024-B003', resolution: null },
    { id: 3, alert_id: 3, station_id: 1, battery_id: null, type: 'repair', status: 'completed', assigned_to: '维修工-王刚', description: '修复3号换电仓门自动锁定机构', resolution: '更换仓门锁止电机，测试正常' },
    { id: 4, alert_id: 5, station_id: 1, battery_id: 4, type: 'replacement', status: 'assigned', assigned_to: '技术员-赵磊', description: '更换泄漏电池BAT-2024-A004并做安全处置', resolution: null },
    { id: 5, alert_id: 6, station_id: 2, battery_id: null, type: 'complaint_handling', status: 'closed', assigned_to: '客服-孙丽', description: '处理用户换电等待时间过长投诉', resolution: '已向用户致歉并补偿1次免费换电' },
  ];

  const insertWorkOrder = db.prepare(`
    INSERT OR IGNORE INTO work_orders (id, alert_id, station_id, battery_id, type, status, assigned_to, description, resolution, created_at, updated_at)
    VALUES (@id, @alert_id, @station_id, @battery_id, @type, @status, @assigned_to, @description, @resolution, @created_at, @updated_at)
  `);

  for (const w of workOrders) {
    insertWorkOrder.run({ ...w, created_at: daysAgo(2), updated_at: daysAgo(0) });
  }

  console.log('Seed data inserted successfully.');
}

seed();
