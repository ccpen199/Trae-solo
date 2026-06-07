import db from './database.ts';

export function migrateDatabase() {
  try {
    const cols = db.pragma("table_info('knight_credit_logs')") as { name: string }[];
    const hasOldScore = cols.some(c => c.name === 'old_score');
    const hasNewScore = cols.some(c => c.name === 'new_score');

    if (!hasOldScore) {
      db.exec('ALTER TABLE knight_credit_logs ADD COLUMN old_score INTEGER DEFAULT 0');
      console.log('Added old_score column to knight_credit_logs');
    }
    if (!hasNewScore) {
      db.exec('ALTER TABLE knight_credit_logs ADD COLUMN new_score INTEGER DEFAULT 0');
      console.log('Added new_score column to knight_credit_logs');
    }

    const knightCols = db.pragma("table_info('knights')") as { name: string }[];
    const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='knights'").get() as { sql: string };
    if (sql && !sql.sql.includes("'suspended'")) {
      db.pragma('foreign_keys = OFF');
      db.exec(`
        CREATE TABLE knights_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id),
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('certified','crowdsourced')),
          status TEXT DEFAULT 'offline' CHECK(status IN ('online','offline','busy','suspended')),
          lat REAL DEFAULT 0,
          lng REAL DEFAULT 0,
          credit_score INTEGER DEFAULT 100,
          total_orders INTEGER DEFAULT 0,
          completed_orders INTEGER DEFAULT 0,
          avg_rating REAL DEFAULT 5.0,
          capacity INTEGER DEFAULT 5,
          current_load INTEGER DEFAULT 0,
          last_active_at TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
        INSERT INTO knights_new SELECT * FROM knights;
        DROP TABLE knights;
        ALTER TABLE knights_new RENAME TO knights;
      `);
      db.pragma('foreign_keys = ON');
      console.log('Updated knights table CHECK constraint to support suspended status');
    }

    db.prepare("UPDATE knights SET status = 'offline' WHERE status NOT IN ('online', 'offline', 'busy', 'suspended')").run();

    const waybillCols = db.pragma("table_info('waybills')") as { name: string }[];
    const hasAcceptedAt = waybillCols.some(c => c.name === 'accepted_at');
    if (!hasAcceptedAt) {
      db.exec('ALTER TABLE waybills ADD COLUMN accepted_at TEXT');
      console.log('Added accepted_at column to waybills');
    }

    const dispatchCols = db.pragma("table_info('dispatch_logs')") as { name: string }[];
    const hasDistance = dispatchCols.some(c => c.name === 'distance');
    if (!hasDistance) {
      db.exec('ALTER TABLE dispatch_logs ADD COLUMN distance REAL DEFAULT 0');
      console.log('Added distance column to dispatch_logs');
    }

    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  }
}
