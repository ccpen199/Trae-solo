const Database = require('better-sqlite3');
const db = new Database('./data/app.sqlite');

// 修复is_complete为1（数据是完整的）
db.prepare('UPDATE ships SET is_complete = 1').run();
console.log('Updated ships is_complete = 1');

// 迁移到schedules表
const ships = db.prepare('SELECT * FROM ships WHERE berth_id IS NOT NULL').all();
for (const ship of ships) {
  const exists = db.prepare('SELECT id FROM schedules WHERE ship_id = ?').get(ship.id);
  if (!exists) {
    db.prepare(`
      INSERT INTO schedules (ship_id, berth_id, start_time, end_time, status)
      VALUES (?, ?, ?, ?, 'confirmed')
    `).run(ship.id, ship.berth_id, ship.berth_start_time, ship.berth_end_time);
    console.log('Created schedule for ship:', ship.name);
  }
}
console.log('Schedules count now:', db.prepare('SELECT COUNT(*) as count FROM schedules').get().count);
