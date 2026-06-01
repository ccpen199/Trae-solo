const Database = require('better-sqlite3');
const db = new Database('./data/app.sqlite');

function addColumnIfNotExists(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  const hasCol = cols.some(c => c.name === column);
  console.log(`${table}表有${column}字段:`, hasCol);
  
  if (!hasCol) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
    console.log(`已添加${column}字段到${table}表`);
  }
}

try {
  // vehicles表
  addColumnIfNotExists('vehicles', 'status', 'TEXT DEFAULT "pending"');
  addColumnIfNotExists('vehicles', 'current_valuation', 'REAL');
  addColumnIfNotExists('vehicles', 'photos', 'TEXT');
  addColumnIfNotExists('vehicles', 'ownership_docs', 'TEXT');
  addColumnIfNotExists('vehicles', 'insurance_docs', 'TEXT');
  addColumnIfNotExists('vehicles', 'mortgage_docs', 'TEXT');
  
  // loans表
  addColumnIfNotExists('loans', 'status', 'TEXT DEFAULT "pending"');
  addColumnIfNotExists('loans', 'disbursement_date', 'DATETIME');
  
  // risk_alerts表
  addColumnIfNotExists('risk_alerts', 'status', 'TEXT DEFAULT "pending"');
  addColumnIfNotExists('risk_alerts', 'level', 'TEXT DEFAULT "medium"');
  addColumnIfNotExists('risk_alerts', 'description', 'TEXT');
  addColumnIfNotExists('risk_alerts', 'handler', 'TEXT');
  addColumnIfNotExists('risk_alerts', 'handled_at', 'DATETIME');
  
  // gps_events表
  addColumnIfNotExists('gps_events', 'is_alert', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('gps_events', 'handled', 'INTEGER DEFAULT 0');
  
  // gps_devices表
  addColumnIfNotExists('gps_devices', 'status', 'TEXT DEFAULT "installed"');
  
  // mortgage_registrations表
  addColumnIfNotExists('mortgage_registrations', 'status', 'TEXT DEFAULT "pending"');
  
  // valuations表
  addColumnIfNotExists('valuations', 'status', 'TEXT DEFAULT "pending"');
  addColumnIfNotExists('valuations', 'is_anomaly', 'INTEGER DEFAULT 0');
  
  console.log('数据库结构修复完成');
} catch(e) {
  console.error('错误:', e.message);
}
db.close();
