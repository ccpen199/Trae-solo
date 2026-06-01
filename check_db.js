import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), './data/app.sqlite');
const db = new DatabaseSync(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', JSON.stringify(tables, null, 2));

for (const t of tables) {
  const cols = db.prepare(`PRAGMA table_info(${t.name})`).all();
  console.log('\n' + t.name + ':');
  for (const c of cols) {
    console.log('  ' + c.name + ' ' + c.type + (c.notnull ? ' NOT NULL' : '') + (c.pk ? ' PRIMARY KEY' : ''));
  }
}

db.close();
