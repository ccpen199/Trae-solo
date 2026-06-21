const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'data', 'app.sqlite');
const db = new Database(dbPath);

console.log('创建测试充电订单数据...\n');

const stations = db.prepare('SELECT * FROM stations').all();
const chargers = db.prepare('SELECT * FROM chargers WHERE status != ?').all('offline');
const users = db.prepare('SELECT * FROM users').all();
const vehicles = db.prepare('SELECT * FROM vehicles').all();

console.log(`充电站: ${stations.length} 个`);
console.log(`充电桩: ${chargers.length} 个`);
console.log(`用户: ${users.length} 个`);
console.log(`车辆: ${vehicles.length} 个`);

function generateOrderNo() {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EV${dateStr}${random}`;
}

const insertOrder = db.prepare(`
  INSERT INTO charging_orders
  (order_no, user_id, vehicle_id, charger_id, station_id,
   start_time, end_time, start_soc, end_soc, energy,
   duration, peak_energy, flat_energy, valley_energy,
   peak_cost, flat_cost, valley_cost, service_fee, total_amount,
   status, payment_status, created_at)
  VALUES
  (@order_no, @user_id, @vehicle_id, @charger_id, @station_id,
   @start_time, @end_time, @start_soc, @end_soc, @energy,
   @duration, @peak_energy, @flat_energy, @valley_energy,
   @peak_cost, @flat_cost, @valley_cost, @service_fee, @total_amount,
   @status, 'completed', @created_at)
`);

const insertPowerData = db.prepare(`
  INSERT INTO charging_power_data
  (order_id, charger_id, voltage, current, power, soc, temperature, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateCharger = db.prepare(`
  UPDATE chargers SET status = ?, updated_at = datetime('now') WHERE id = ?
`);

const insertChargerStatus = db.prepare(`
  INSERT INTO charger_status
  (charger_id, voltage, current, power, temperature, soc,
   fault_code, fault_message, occupied_duration, is_occupied, is_charging, is_offline, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

const now = new Date();
let chargingCount = 0;
let completedCount = 0;

for (let i = 0; i < 25; i++) {
  const charger = chargers[i % chargers.length];
  const user = users[i % users.length];
  const vehicle = vehicles.length > 0 ? vehicles[i % vehicles.length] : { id: 1 };
  const station = stations.find(s => s.id === charger.station_id) || stations[0];

  const isCharging = i < 6;
  const orderNo = generateOrderNo() + i.toString().padStart(3, '0');
  const startSoc = 15 + Math.floor(Math.random() * 25);
  const endSoc = 75 + Math.floor(Math.random() * 20);
  const batteryCapacity = 60;
  const energy = isCharging
    ? Math.round(((50 - startSoc) / 100 * batteryCapacity) * 10) / 10
    : Math.round(((endSoc - startSoc) / 100 * batteryCapacity) * 10) / 10;

  const durationMinutes = 40 + Math.floor(Math.random() * 120);
  const duration = isCharging
    ? Math.floor(durationMinutes * 60 * 0.5)
    : durationMinutes * 60;

  const peakRatio = 0.35;
  const flatRatio = 0.45;
  const valleyRatio = 0.2;

  const peakEnergy = Math.round(energy * peakRatio * 100) / 100;
  const flatEnergy = Math.round(energy * flatRatio * 100) / 100;
  const valleyEnergy = Math.round(energy * valleyRatio * 100) / 100;

  const peakPrice = 1.2;
  const flatPrice = 0.8;
  const valleyPrice = 0.4;
  const serviceFeeRate = 0.6;

  const peakCost = Math.round(peakEnergy * peakPrice * 100) / 100;
  const flatCost = Math.round(flatEnergy * flatPrice * 100) / 100;
  const valleyCost = Math.round(valleyEnergy * valleyPrice * 100) / 100;
  const serviceFee = Math.round(energy * serviceFeeRate * 100) / 100;
  const totalAmount = Math.round((peakCost + flatCost + valleyCost + serviceFee) * 100) / 100;

  const hoursAgo = isCharging ? (0.3 + Math.random() * 0.7) : (1 + Math.random() * 48);
  const startTime = new Date(now.getTime() - hoursAgo * 3600 * 1000);
  const endTime = isCharging ? null : new Date(startTime.getTime() + duration * 1000);

  insertOrder.run({
    order_no: orderNo,
    user_id: user.id,
    vehicle_id: vehicle.id,
    charger_id: charger.id,
    station_id: station.id,
    start_time: startTime.toISOString(),
    end_time: endTime ? endTime.toISOString() : null,
    start_soc: startSoc,
    end_soc: isCharging ? null : endSoc,
    energy: energy,
    duration: duration,
    peak_energy: peakEnergy,
    flat_energy: flatEnergy,
    valley_energy: valleyEnergy,
    peak_cost: peakCost,
    flat_cost: flatCost,
    valley_cost: valleyCost,
    service_fee: serviceFee,
    total_amount: totalAmount,
    status: isCharging ? 'charging' : 'completed',
    created_at: startTime.toISOString()
  });

  const orderId = db.prepare('SELECT last_insert_rowid() as id').get().id;

  const powerPoints = isCharging ? 12 : 30;
  for (let j = 0; j < powerPoints; j++) {
    const pointTime = new Date(startTime.getTime() + (j / powerPoints) * duration * 1000);
    const socProgress = isCharging
      ? startSoc + (50 - startSoc) * (j / powerPoints)
      : startSoc + (endSoc - startSoc) * (j / powerPoints);
    const power = charger.type === 'fast'
      ? 80 + Math.sin(j / 5) * 20 + Math.random() * 10
      : 30 + Math.sin(j / 5) * 5 + Math.random() * 5;
    const current = power / 0.38;
    const temperature = 35 + Math.random() * 8;

    insertPowerData.run(
      orderId, charger.id,
      380 + Math.random() * 10,
      Math.round(current * 10) / 10,
      Math.round(power * 10) / 10,
      Math.round(socProgress * 10) / 10,
      Math.round(temperature * 10) / 10,
      pointTime.toISOString()
    );
  }

  if (isCharging) {
    chargingCount++;
    updateCharger.run('charging', charger.id);
    insertChargerStatus.run(
      charger.id,
      380 + Math.random() * 10,
      Math.round((80 / 0.38) * 10) / 10,
      80 + Math.random() * 10,
      38 + Math.random() * 5,
      50,
      null, null,
      Math.floor(duration * 0.5),
      1, 1, 0
    );
  } else {
    completedCount++;
  }
}

console.log(`\n✅ 创建成功:`);
console.log(`   充电中订单: ${chargingCount} 个`);
console.log(`   已完成订单: ${completedCount} 个`);
console.log(`   总计: ${chargingCount + completedCount} 个`);

const orderCount = db.prepare('SELECT COUNT(*) as cnt FROM charging_orders').get().cnt;
console.log(`\n订单总数: ${orderCount} 条`);

const dailyCount = db.prepare('SELECT COUNT(*) as cnt FROM daily_revenue').get().cnt;
console.log(`日收益记录: ${dailyCount} 条`);

const alarmCount = db.prepare('SELECT COUNT(*) as cnt FROM alarm_work_orders').get().cnt;
console.log(`告警工单: ${alarmCount} 条`);

db.close();
console.log('\n✅ 测试数据创建完成！');
