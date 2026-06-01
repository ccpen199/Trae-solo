import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    business_hours TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS service_queues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    prefix TEXT NOT NULL,
    average_duration INTEGER DEFAULT 10,
    max_waiting INTEGER DEFAULT 50,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS windows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    queue_id INTEGER,
    status TEXT DEFAULT 'open',
    current_ticket_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (queue_id) REFERENCES service_queues(id)
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    queue_id INTEGER NOT NULL,
    ticket_number TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    customer_count INTEGER DEFAULT 1,
    phone TEXT,
    notify_method TEXT DEFAULT 'none',
    status TEXT DEFAULT 'waiting',
    estimated_wait_time INTEGER DEFAULT 0,
    actual_wait_time INTEGER DEFAULT 0,
    service_duration INTEGER DEFAULT 0,
    called_at DATETIME,
    served_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (queue_id) REFERENCES service_queues(id)
  );

  CREATE TABLE IF NOT EXISTS ticket_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    window_id INTEGER,
    action TEXT NOT NULL,
    operator TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (window_id) REFERENCES windows(id)
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    ticket_id INTEGER,
    type TEXT NOT NULL,
    description TEXT,
    handler TEXT,
    status TEXT DEFAULT 'pending',
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
  );

  CREATE TABLE IF NOT EXISTS pause_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    reason TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    days TEXT,
    duration INTEGER,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );
`);

const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get();
if (storeCount.count === 0) {
  const insertStore = db.prepare('INSERT INTO stores (name, address, phone, business_hours) VALUES (?, ?, ?, ?)');
  insertStore.run('旗舰店', '北京市朝阳区xxx路xxx号', '010-12345678', '09:00-21:00');
  
  const insertQueue = db.prepare('INSERT INTO service_queues (store_id, name, prefix, average_duration) VALUES (?, ?, ?, ?)');
  insertQueue.run(1, '普通业务', 'A', 10);
  insertQueue.run(1, 'VIP业务', 'B', 15);
  insertQueue.run(1, '快速通道', 'C', 5);
  
  const insertWindow = db.prepare('INSERT INTO windows (store_id, name, queue_id) VALUES (?, ?, ?)');
  insertWindow.run(1, '1号窗口', 1);
  insertWindow.run(1, '2号窗口', 1);
  insertWindow.run(1, '3号窗口', 2);
  insertWindow.run(1, '4号窗口', 3);
}

export default db;
