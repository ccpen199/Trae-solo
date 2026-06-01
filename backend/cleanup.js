import Database from 'better-sqlite3';
const db = new Database('../data/app.sqlite');

console.log('当前队列列表:');
const queues = db.prepare('SELECT * FROM service_queues').all();
queues.forEach(q => console.log(`  id=${q.id}, name=${q.name}, prefix=${q.prefix}`));

const deleteIds = [5, 6];
deleteIds.forEach(id => {
  try {
    db.prepare('DELETE FROM ticket_logs WHERE ticket_id IN (SELECT id FROM tickets WHERE queue_id = ?)').run(id);
    db.prepare('DELETE FROM tickets WHERE queue_id = ?').run(id);
    db.prepare('DELETE FROM service_queues WHERE id = ?').run(id);
    console.log(`已删除队列 id=${id}`);
  } catch(e) {
    console.log(`删除 id=${id} 失败: ${e.message}`);
  }
});

console.log('\n清理后队列列表:');
db.prepare('SELECT * FROM service_queues').all().forEach(q => console.log(`  id=${q.id}, name=${q.name}, prefix=${q.prefix}`));

console.log('\n清理重复门店:');
const stores = db.prepare('SELECT * FROM stores').all();
stores.forEach(s => console.log(`  id=${s.id}, name=${s.name}`));

const deleteStoreIds = [2, 3];
deleteStoreIds.forEach(id => {
  try {
    db.prepare('DELETE FROM pause_rules WHERE store_id = ?').run(id);
    db.prepare('DELETE FROM complaints WHERE store_id = ?').run(id);
    db.prepare('DELETE FROM ticket_logs WHERE ticket_id IN (SELECT id FROM tickets WHERE store_id = ?)').run(id);
    db.prepare('DELETE FROM tickets WHERE store_id = ?').run(id);
    db.prepare('DELETE FROM windows WHERE store_id = ?').run(id);
    db.prepare('DELETE FROM service_queues WHERE store_id = ?').run(id);
    db.prepare('DELETE FROM stores WHERE id = ?').run(id);
    console.log(`已删除门店 id=${id}`);
  } catch(e) {
    console.log(`删除门店 id=${id} 失败: ${e.message}`);
  }
});

console.log('\n清理后门店列表:');
db.prepare('SELECT * FROM stores').all().forEach(s => console.log(`  id=${s.id}, name=${s.name}`));

db.close();
console.log('\n清理完成!');
