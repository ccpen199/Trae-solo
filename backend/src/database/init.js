const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS containers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    container_number TEXT UNIQUE NOT NULL,
    booking_number TEXT,
    bill_of_lading TEXT,
    container_type TEXT,
    seal_number TEXT,
    shipper TEXT,
    origin_port TEXT,
    destination_port TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS container_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    container_id INTEGER NOT NULL,
    node_type TEXT NOT NULL,
    node_time DATETIME NOT NULL,
    source TEXT,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS exceptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    container_id INTEGER NOT NULL,
    exception_type TEXT NOT NULL,
    description TEXT,
    responsible_party TEXT,
    action_taken TEXT,
    status TEXT DEFAULT 'open',
    reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS internal_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    container_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    created_by TEXT,
    is_sensitive BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_containers_number ON containers(container_number);
  CREATE INDEX IF NOT EXISTS idx_nodes_container ON container_nodes(container_id);
  CREATE INDEX IF NOT EXISTS idx_exceptions_container ON exceptions(container_id);
`);

console.log('数据库初始化完成');
db.close();
