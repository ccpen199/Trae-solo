console.log('step 1');
import initSqlJs from 'sql.js';
console.log('step 2');
initSqlJs().then(SQL => {
  console.log('step 3');
  const db = new SQL.Database();
  console.log('step 4');
  db.exec("CREATE TABLE t (id INTEGER)");
  db.exec("INSERT INTO t VALUES (1), (2)");
  const r = db.exec("SELECT * FROM t");
  console.log('result:', JSON.stringify(r));
  const data = db.export();
  console.log('export ok, size:', data.length);
}).catch(e => console.error('sql err:', e.message, e.stack));
