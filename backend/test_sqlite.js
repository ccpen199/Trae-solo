const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('Testing better-sqlite3...');
console.log('Node version:', process.version);
console.log('Current dir:', process.cwd());

const dbPath = path.resolve(process.cwd(), 'data', 'test.db');
console.log('DB Path:', dbPath);

try {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  
  const db = new Database(dbPath);
  console.log('Database created successfully');
  
  db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
  console.log('Table created');
  
  const stmt = db.prepare('INSERT INTO test (name) VALUES (?)');
  stmt.run('Test Name');
  console.log('Data inserted');
  
  const row = db.prepare('SELECT * FROM test').get();
  console.log('Data retrieved:', row);
  
  db.close();
  console.log('Database closed');
  console.log('SUCCESS: better-sqlite3 is working!');
} catch (error) {
  console.error('ERROR:', error);
  process.exit(1);
}
