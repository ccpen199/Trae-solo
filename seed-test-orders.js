const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'data', 'app.sqlite');
const db = new Database(dbPath);

console.log('创建测试充电订单...\n');

const stations = db.prepare('SELECT * FROM stations').all();
const chargers = db.prepare('SELECT * FROM chargers WHERE status != ?').all('offline');
const users = db.prepare('SELECT * FROM users').all();

console.log(`充电站: ${stations.length} 个`);
console.log(`充电桩: ${chargers.length} 个`);
console.log(`用户: ${users.length} 个`);

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
   start_time, end_time, start_soc, end_soc, total_energy, 
   duration_seconds, peak_energy, flat_energy, valley_energy,
   peak_cost, flat_cost, valley_cost, service_fee, total_amount, status)
  VALUES 
  (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateCharger = db.prepare(`
  UPDATE chargers SET status = ?, is_occupied = ?, is_charging = ? WHERE id = ?
`);

let chargingCount = 0;
let completedCount = 0;
const today = new Date();

for (let i = 0; i < 8; i++) {
  const charger = chargers[i % chargers.length];
  const user = users[i % users.length];
  const station = stations.find(s => s.id === charger.station_id) || stations[0];
  
  const vehicles = db.prepare('SELECT * FROM vehicles WHERE user_id = ?').all(user.id);
  const vehicle = vehicles.length > 0 ? vehicles[0] : { id: 1 };
  
  const orderNo = generateOrderNo();
  const startSoc = 20 + Math.floor(Math.random() * 30);
  const endSoc = 70 + Math.floor(Math.random() * 25);
  const batteryCapacity = 60;
  const energy = (endSoc - startSoc) / 100 * batteryCapacity;
  
  const durationMinutes = 30 + Math.floor(Math.random() * 120);
  const durationSeconds = durationMinutes * 60;
  
  const peakRatio = 0.4;
  const flatRatio = 0.4;
  const valleyRatio = 0.2;
  
  const peakEnergy = energy * peakRatio;
  const flatEnergy = energy * flatRatio;
  const valleyEnergy = energy * valleyRatio;
  
  const peakPrice = 1.2;
  const flatPrice = 0.8;
  const valleyPrice = 0.4;
  const serviceFee = 0.6;
  
  const peakCost = peakEnergy * peakPrice;
  const flatCost = flatEnergy * flatPrice;
  const valleyCost = valleyEnergy * valleyPrice;
  const serviceFeeTotal = energy * serviceFee;
  const totalAmount = peakCost + flatCost + valleyCost + serviceFeeTotal;
  
  const isCharging = i < 3;
  
  const startTime = new Date(today.getTime() - durationMinutes * 60 * 1000 - Math.random() * 3600000);
  const endTime = isCharging ? null : new Date(startTime.getTime() + durationSeconds * 1000);
  
  const result = insertOrder.run(
    orderNo, user.id, vehicle.id, charger.id, station.id,
    startTime.toISOString(),
    endTime ? endTime.toISOString() : null,
    startSoc, isCharging ? null : endSoc,
    isCharging ? energy * 0.6 : energy,
    isCharging ? Math.floor(durationSeconds * 0.6) : durationSeconds,
    peakEnergy, flatEnergy, valleyEnergy,
    peakCost, flatCost, valleyCost,
    serviceFeeTotal, totalAmount,
    isCharging ? 'charging' : 'completed'
  );
  
  if (isCharging) {
    chargingCount++;
    updateCharger.run('charging', 1, 1, charger.id);
    
    db.prepare(`
      INSERT INTO charger_status 
      (charger_id, voltage, current, power, temperature, soc, 
       fault_code, fault_message, occupied_duration, is_occupied, is_charging, is_offline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      charger.id,
      380 + Math.random() * 20,
      100 + Math.random() * 50,
      80 + Math.random() * 30,
      35 + Math.random() * 10,
      startSoc + 20,
      null, null,
      Math.floor(durationSeconds * 0.6),
      1, 1, 0
    );
  } else {
    completedCount++;
  }
}

console.log(`\n创建完成:`);
console.log(`  充电中订单: ${chargingCount} 个`);
console.log(`  已完成订单: ${completedCount} 个`);
console.log(`  总计: ${chargingCount + completedCount} 个`);

db.close();
console.log('\n测试数据创建完成！');
