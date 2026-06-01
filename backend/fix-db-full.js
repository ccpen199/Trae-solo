const Database = require('better-sqlite3');
const db = new Database('./data/app.sqlite');

function addColumnIfNotExists(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  const hasCol = cols.some(c => c.name === column);
  if (!hasCol) {
    console.log(`  添加字段 ${table}.${column}`);
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

console.log('开始修复数据库结构...');

// 修复 gps_devices 表 - device_no 改名为 device_number
console.log('=== gps_devices ===');
addColumnIfNotExists('gps_devices', 'device_number', 'TEXT');
addColumnIfNotExists('gps_devices', 'install_date', 'DATETIME');
addColumnIfNotExists('gps_devices', 'current_lat', 'REAL');
addColumnIfNotExists('gps_devices', 'current_lng', 'REAL');

// 修复 gps_events 表
console.log('=== gps_events ===');
addColumnIfNotExists('gps_events', 'description', 'TEXT');
addColumnIfNotExists('gps_events', 'lat', 'REAL');
addColumnIfNotExists('gps_events', 'lng', 'REAL');

// 修复 disposal_actions 表
console.log('=== disposal_actions ===');
addColumnIfNotExists('disposal_actions', 'notes', 'TEXT');
addColumnIfNotExists('disposal_actions', 'action_date', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

// 修复 loans 表 - 确保字段齐全
console.log('=== loans ===');
addColumnIfNotExists('loans', 'disbursed_at', 'DATETIME');

// 修复 vehicles 表 - 确保字段齐全
console.log('=== vehicles ===');
addColumnIfNotExists('vehicles', 'brand', 'TEXT');
addColumnIfNotExists('vehicles', 'model', 'TEXT');
addColumnIfNotExists('vehicles', 'year', 'INTEGER');
addColumnIfNotExists('vehicles', 'color', 'TEXT');
addColumnIfNotExists('vehicles', 'mileage', 'REAL');

console.log('数据库结构修复完成！');
db.close();
