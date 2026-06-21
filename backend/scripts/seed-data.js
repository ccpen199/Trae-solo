const db = require('../src/config/database');

const stations = [
  {
    name: '北京国贸停车场充电站',
    address: '北京市朝阳区建国门外大街1号',
    city: '北京',
    province: '北京市',
    lat: 39.9087,
    lng: 116.4123,
    total_piles: 12,
    fast_piles: 8,
    slow_piles: 4
  },
  {
    name: '上海陆家嘴金融中心充电站',
    address: '上海市浦东新区世纪大道100号',
    city: '上海',
    province: '上海市',
    lat: 31.2397,
    lng: 121.4998,
    total_piles: 16,
    fast_piles: 10,
    slow_piles: 6
  },
  {
    name: '广州珠江新城充电站',
    address: '广州市天河区珠江东路1号',
    city: '广州',
    province: '广东省',
    lat: 23.1291,
    lng: 113.2644,
    total_piles: 10,
    fast_piles: 6,
    slow_piles: 4
  },
  {
    name: '深圳科技园充电站',
    address: '深圳市南山区科技南一路1号',
    city: '深圳',
    province: '广东省',
    lat: 22.5431,
    lng: 113.9413,
    total_piles: 20,
    fast_piles: 14,
    slow_piles: 6
  },
  {
    name: '杭州西溪湿地充电站',
    address: '杭州市西湖区文一西路588号',
    city: '杭州',
    province: '浙江省',
    lat: 30.2741,
    lng: 120.1551,
    total_piles: 8,
    fast_piles: 5,
    slow_piles: 3
  },
  {
    name: '成都天府广场充电站',
    address: '成都市锦江区天府广场',
    city: '成都',
    province: '四川省',
    lat: 30.6636,
    lng: 104.0668,
    total_piles: 10,
    fast_piles: 6,
    slow_piles: 4
  }
];

const insertStation = db.prepare(`
  INSERT INTO stations (name, address, city, province, lat, lng, total_piles, fast_piles, slow_piles)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertCharger = db.prepare(`
  INSERT INTO chargers (station_id, charger_code, type, power_rating, protocol, ocpp_version, status, health_score)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertPriceStrategy = db.prepare(`
  INSERT INTO price_strategies (station_id, name, type, effective_date, expire_date, is_active)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertPricePeriod = db.prepare(`
  INSERT INTO price_periods (strategy_id, period_type, start_time, end_time, electricity_price, service_price)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertUser = db.prepare(`
  INSERT INTO users (phone, nickname, balance, total_charging_count, total_energy)
  VALUES (?, ?, ?, ?, ?)
`);

const insertVehicle = db.prepare(`
  INSERT INTO vehicles (user_id, plate_number, brand, model, battery_capacity, current_range, max_range)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertChargerStatus = db.prepare(`
  INSERT INTO charger_status (charger_id, voltage, current, power, temperature, soc, fault_code, fault_message, occupied_duration, is_occupied, is_charging, is_offline)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都'];

const tx = db.transaction(() => {
  stations.forEach((station, sIdx) => {
    const stationId = insertStation.run(
      station.name, station.address, station.city, station.province,
      station.lat, station.lng, station.total_piles, station.fast_piles, station.slow_piles
    ).lastInsertRowid;

    const strategyId = insertPriceStrategy.run(
      stationId, `${station.city}分时电价`, 'time_of_use', '2024-01-01', '2026-12-31', 1
    ).lastInsertRowid;

    insertPricePeriod.run(strategyId, 'peak', '10:00', '12:00', 1.8, 0.8);
    insertPricePeriod.run(strategyId, 'peak', '14:00', '15:00', 1.8, 0.8);
    insertPricePeriod.run(strategyId, 'peak', '18:00', '21:00', 1.8, 0.8);
    insertPricePeriod.run(strategyId, 'flat', '07:00', '10:00', 1.2, 0.6);
    insertPricePeriod.run(strategyId, 'flat', '12:00', '14:00', 1.2, 0.6);
    insertPricePeriod.run(strategyId, 'flat', '15:00', '18:00', 1.2, 0.6);
    insertPricePeriod.run(strategyId, 'flat', '21:00', '23:00', 1.2, 0.6);
    insertPricePeriod.run(strategyId, 'valley', '23:00', '07:00', 0.5, 0.4);

    for (let i = 0; i < station.fast_piles; i++) {
      const chargerCode = `EV-${cities[sIdx]}-F-${String(i + 1).padStart(4, '0')}`;
      const chargerId = insertCharger.run(
        stationId, chargerCode, 'fast', 120, 'GB/T', '1.6',
        Math.random() > 0.15 ? 'online' : 'offline',
        70 + Math.random() * 30
      ).lastInsertRowid;

      const isOccupied = Math.random() > 0.5;
      const isCharging = isOccupied && Math.random() > 0.3;
      insertChargerStatus.run(
        chargerId,
        isCharging ? 380 + Math.random() * 20 : 0,
        isCharging ? 150 + Math.random() * 100 : 0,
        isCharging ? 60 + Math.random() * 60 : 0,
        isCharging ? 35 + Math.random() * 15 : 25,
        isCharging ? 30 + Math.random() * 50 : 0,
        null, null,
        isOccupied ? Math.floor(Math.random() * 3600) : 0,
        isOccupied ? 1 : 0,
        isCharging ? 1 : 0,
        0
      );
    }

    for (let i = 0; i < station.slow_piles; i++) {
      const chargerCode = `EV-${cities[sIdx]}-S-${String(i + 1).padStart(4, '0')}`;
      const chargerId = insertCharger.run(
        stationId, chargerCode, 'slow', 7, 'GB/T', '1.6',
        Math.random() > 0.1 ? 'online' : 'offline',
        75 + Math.random() * 25
      ).lastInsertRowid;

      const isOccupied = Math.random() > 0.4;
      const isCharging = isOccupied && Math.random() > 0.3;
      insertChargerStatus.run(
        chargerId,
        isCharging ? 220 + Math.random() * 10 : 0,
        isCharging ? 20 + Math.random() * 15 : 0,
        isCharging ? 5 + Math.random() * 2 : 0,
        isCharging ? 30 + Math.random() * 10 : 25,
        isCharging ? 20 + Math.random() * 60 : 0,
        null, null,
        isOccupied ? Math.floor(Math.random() * 7200) : 0,
        isOccupied ? 1 : 0,
        isCharging ? 1 : 0,
        0
      );
    }
  });

  const users = [
    { phone: '13800138001', nickname: '张先生', balance: 500, total_charging_count: 128, total_energy: 4520.5 },
    { phone: '13800138002', nickname: '李女士', balance: 1200, total_charging_count: 256, total_energy: 8960.3 },
    { phone: '13800138003', nickname: '王先生', balance: 300, total_charging_count: 64, total_energy: 2180.8 },
    { phone: '13800138004', nickname: '赵女士', balance: 800, total_charging_count: 180, total_energy: 6320.2 },
    { phone: '13800138005', nickname: '刘先生', balance: 1500, total_charging_count: 320, total_energy: 12500.0 }
  ];

  const vehicles = [
    { plate: '京A12345', brand: '特斯拉', model: 'Model 3', battery: 60, range: 350, maxRange: 556 },
    { plate: '沪B67890', brand: '比亚迪', model: '汉EV', battery: 76.9, range: 420, maxRange: 605 },
    { plate: '粤C11111', brand: '蔚来', model: 'ES6', battery: 75, range: 380, maxRange: 610 },
    { plate: '粤D22222', brand: '小鹏', model: 'P7', battery: 80.9, range: 450, maxRange: 706 },
    { plate: '浙E33333', brand: '理想', model: 'L9', battery: 44.5, range: 180, maxRange: 1315 }
  ];

  users.forEach((user, idx) => {
    const userId = insertUser.run(user.phone, user.nickname, user.balance, user.total_charging_count, user.total_energy).lastInsertRowid;
    const v = vehicles[idx];
    insertVehicle.run(userId, v.plate, v.brand, v.model, v.battery, v.range, v.maxRange);
  });

  const insertAlarm = db.prepare(`
    INSERT INTO alarm_work_orders (work_order_no, charger_id, station_id, alarm_type, alarm_code, alarm_message, alarm_level, status, assignee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAlarm.run('ALARM-2024-001', 1, 1, 'overheat', 'E001', '充电枪温度过高', 'high', 'processing', '张工');
  insertAlarm.run('ALARM-2024-002', 5, 1, 'offline', 'E002', '设备离线超过30分钟', 'medium', 'pending', null);
  insertAlarm.run('ALARM-2024-003', 10, 2, 'voltage_abnormal', 'E003', '输入电压异常', 'high', 'pending', null);
  insertAlarm.run('ALARM-2024-004', 15, 2, 'communication_error', 'E004', 'OCPP通信中断', 'medium', 'resolved', '李工');
  insertAlarm.run('ALARM-2024-005', 20, 3, 'connector_fault', 'E005', '充电连接器故障', 'high', 'processing', '王工');

  const now = new Date();
  for (let day = 0; day < 30; day++) {
    const reportDate = new Date(now);
    reportDate.setDate(reportDate.getDate() - day);
    const dateStr = reportDate.toISOString().split('T')[0];
    
    for (let stationId = 1; stationId <= 6; stationId++) {
      const insertDaily = db.prepare(`
        INSERT OR REPLACE INTO daily_revenue 
        (station_id, report_date, total_orders, total_energy, total_amount, peak_energy, flat_energy, valley_energy, peak_amount, flat_amount, valley_amount, service_fee)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const orders = Math.floor(20 + Math.random() * 60);
      const energy = 300 + Math.random() * 1200;
      const peakEnergy = energy * 0.4;
      const flatEnergy = energy * 0.35;
      const valleyEnergy = energy * 0.25;
      const peakAmount = peakEnergy * 2.6;
      const flatAmount = flatEnergy * 1.8;
      const valleyAmount = valleyEnergy * 0.9;
      const serviceFee = energy * 0.6;
      const totalAmount = peakAmount + flatAmount + valleyAmount + serviceFee;

      insertDaily.run(stationId, dateStr, orders, energy, totalAmount, peakEnergy, flatEnergy, valleyEnergy, peakAmount, flatAmount, valleyAmount, serviceFee);
    }
  }

  const monthStr = now.toISOString().slice(0, 7);
  for (let stationId = 1; stationId <= 6; stationId++) {
    const insertMonthly = db.prepare(`
      INSERT OR REPLACE INTO monthly_revenue 
      (station_id, report_month, total_orders, total_energy, total_amount, service_fee)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const orders = Math.floor(600 + Math.random() * 1800);
    const energy = 9000 + Math.random() * 36000;
    const serviceFee = energy * 0.6;
    const totalAmount = energy * 1.8 + serviceFee;

    insertMonthly.run(stationId, monthStr, orders, energy, totalAmount, serviceFee);
  }

  console.log('数据填充完成');
});

try {
  tx();
} catch (err) {
  console.error('数据填充失败:', err);
} finally {
  db.close();
}
