const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      contact TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS room_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      beds INTEGER DEFAULT 1,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS control_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER NOT NULL,
      room_type_id INTEGER NOT NULL,
      date DATE NOT NULL,
      total_rooms INTEGER NOT NULL,
      used_rooms INTEGER DEFAULT 0,
      price REAL NOT NULL,
      release_date DATE NOT NULL,
      team_name TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
      FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      route TEXT,
      departure_date DATE,
      sales_manager TEXT,
      tourist_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      control_plan_id INTEGER NOT NULL,
      rooms_needed INTEGER NOT NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      status TEXT DEFAULT 'reserved',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (control_plan_id) REFERENCES control_plans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tourists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      id_card TEXT,
      phone TEXT,
      gender TEXT,
      room_number TEXT,
      check_in DATE,
      check_out DATE,
      status TEXT DEFAULT 'confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS room_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      control_plan_id INTEGER NOT NULL,
      team_id INTEGER,
      adjustment_type TEXT NOT NULL,
      rooms_change INTEGER NOT NULL,
      reason TEXT,
      operator TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (control_plan_id) REFERENCES control_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS hotel_confirmations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      hotel_id INTEGER NOT NULL,
      confirmed_rooms INTEGER,
      actual_checkin INTEGER DEFAULT 0,
      cancelled INTEGER DEFAULT 0,
      no_show INTEGER DEFAULT 0,
      price_diff REAL DEFAULT 0,
      invoice_status TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'pending',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      hotel_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      actual_amount REAL,
      paid_amount REAL DEFAULT 0,
      invoice_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_control_plans_date ON control_plans(date);
    CREATE INDEX IF NOT EXISTS idx_control_plans_hotel ON control_plans(hotel_id, date);
    CREATE INDEX IF NOT EXISTS idx_teams_departure ON teams(departure_date);
    CREATE INDEX IF NOT EXISTS idx_tourists_team ON tourists(team_id);
  `);
}

initDatabase();

module.exports = db;
