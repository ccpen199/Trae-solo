const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS baggage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      baggage_tag TEXT UNIQUE NOT NULL,
      passenger_name TEXT NOT NULL,
      passenger_phone TEXT,
      passenger_id_card TEXT,
      flight_no TEXT NOT NULL,
      flight_date TEXT NOT NULL,
      departure TEXT NOT NULL,
      destination TEXT NOT NULL,
      pieces INTEGER NOT NULL DEFAULT 1,
      weight REAL NOT NULL,
      check_in_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_transit',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS baggage_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      baggage_id INTEGER NOT NULL,
      node_type TEXT NOT NULL,
      node_name TEXT NOT NULL,
      location TEXT,
      operator TEXT,
      remark TEXT,
      node_time TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (baggage_id) REFERENCES baggage(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS baggage_exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      baggage_id INTEGER NOT NULL,
      exception_type TEXT NOT NULL,
      exception_name TEXT NOT NULL,
      description TEXT,
      report_time TEXT NOT NULL,
      reporter TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      inquiry_no TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (baggage_id) REFERENCES baggage(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exception_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT,
      file_size INTEGER,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exception_id) REFERENCES baggage_exceptions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS compensation_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_id INTEGER NOT NULL,
      responsible_party TEXT NOT NULL,
      compensation_standard TEXT,
      amount REAL NOT NULL DEFAULT 0,
      applicant TEXT,
      approver TEXT,
      approval_status TEXT NOT NULL DEFAULT 'pending',
      approval_time TEXT,
      close_reason TEXT,
      closed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exception_id) REFERENCES baggage_exceptions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      operator TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exception_id) REFERENCES baggage_exceptions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_baggage_tag ON baggage(baggage_tag);
    CREATE INDEX IF NOT EXISTS idx_baggage_flight ON baggage(flight_no, flight_date);
    CREATE INDEX IF NOT EXISTS idx_nodes_baggage ON baggage_nodes(baggage_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_type ON baggage_nodes(node_type);
    CREATE INDEX IF NOT EXISTS idx_exceptions_baggage ON baggage_exceptions(baggage_id);
    CREATE INDEX IF NOT EXISTS idx_exceptions_status ON baggage_exceptions(status);
    CREATE INDEX IF NOT EXISTS idx_exceptions_type ON baggage_exceptions(exception_type);
    CREATE INDEX IF NOT EXISTS idx_compensation_status ON compensation_records(approval_status);
  `);
}

module.exports = { db, initDatabase };
