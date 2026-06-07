import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT,
      capacity INTEGER DEFAULT 0,
      seat_config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS seat_sections (
      id TEXT PRIMARY KEY,
      venue_id TEXT NOT NULL,
      name TEXT NOT NULL,
      rows INTEGER NOT NULL,
      seats_per_row INTEGER NOT NULL,
      price_level TEXT DEFAULT 'normal',
      base_price REAL DEFAULT 0,
      is_blind_zone INTEGER DEFAULT 0,
      coordinates TEXT,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS seats (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL,
      row_label TEXT NOT NULL,
      seat_number INTEGER NOT NULL,
      status TEXT DEFAULT 'available',
      x REAL,
      y REAL,
      z REAL,
      FOREIGN KEY (section_id) REFERENCES seat_sections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT,
      description TEXT,
      poster_url TEXT,
      duration INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      venue_id TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      status TEXT DEFAULT 'draft',
      sale_start_time DATETIME,
      sale_end_time DATETIME,
      is_seckill INTEGER DEFAULT 0,
      refund_policy TEXT,
      fee_rate REAL DEFAULT 0,
      total_inventory INTEGER DEFAULT 0,
      sold_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS session_prices (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES seat_sections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS session_seats (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      seat_id TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      price REAL,
      lock_expire_at DATETIME,
      locked_by TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE,
      email TEXT,
      nickname TEXT,
      avatar_url TEXT,
      password_hash TEXT,
      total_orders INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      preference_tags TEXT,
      price_sensitivity REAL DEFAULT 0,
      risk_level INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      payment_time DATETIME,
      refund_amount REAL DEFAULT 0,
      refund_time DATETIME,
      channel TEXT DEFAULT 'online',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      session_seat_id TEXT NOT NULL,
      seat_id TEXT NOT NULL,
      price REAL NOT NULL,
      ticket_id TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      seat_id TEXT,
      seat_info TEXT,
      qr_code TEXT,
      verify_code TEXT,
      watermark TEXT,
      status TEXT DEFAULT 'valid',
      verify_count INTEGER DEFAULT 0,
      last_verify_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_sync (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      external_id TEXT,
      available_count INTEGER DEFAULT 0,
      last_sync_time DATETIME,
      sync_status TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verify_records (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      verify_method TEXT NOT NULL,
      verify_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      operator TEXT,
      result TEXT,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    );

    CREATE TABLE IF NOT EXISTS marketing_activities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT,
      start_time DATETIME,
      end_time DATETIME,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ab_test_groups (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL,
      group_name TEXT NOT NULL,
      weight INTEGER DEFAULT 50,
      config TEXT,
      conversion_count INTEGER DEFAULT 0,
      click_count INTEGER DEFAULT 0,
      FOREIGN KEY (activity_id) REFERENCES marketing_activities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS risk_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      config TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_risk_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      risk_type TEXT NOT NULL,
      risk_score INTEGER DEFAULT 0,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_event ON sessions(event_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_venue ON sessions(venue_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_session ON tickets(session_id);
  `);

  console.log('Database initialized successfully');
}

export { db, initDatabase };
