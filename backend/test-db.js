const { initDb, getDb } = require('./src/db');
try {
  initDb();
  console.log('DB init ok');
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM pet_reports').get();
  console.log('Reports:', count.c);
} catch(e) {
  console.error('Error:', e.message);
  console.error(e.stack);
}
