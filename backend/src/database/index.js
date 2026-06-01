const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

let db;

function initDatabase(dbPath) {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  const seeded = db.prepare("SELECT value FROM system_flags WHERE key = 'seeded'").get();
  if (!seeded) {
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      const seed = fs.readFileSync(seedPath, 'utf8');
      db.exec(seed);
    }
    db.prepare("INSERT INTO system_flags (key, value) VALUES ('seeded', 'true')").run();
  }

  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

module.exports = { initDatabase, getDb };
