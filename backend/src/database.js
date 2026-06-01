const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`DROP TABLE IF EXISTS settlement_items;`);
  db.exec(`DROP TABLE IF EXISTS settlements;`);
  db.exec(`DROP TABLE IF EXISTS bl_revisions;`);
  db.exec(`DROP TABLE IF EXISTS bill_of_lading;`);
  db.exec(`DROP TABLE IF EXISTS bookings;`);
  db.exec(`DROP TABLE IF EXISTS space_confirmations;`);
  db.exec(`DROP TABLE IF EXISTS quotations;`);
  db.exec(`DROP TABLE IF EXISTS inquiries;`);
  
  db.exec(`
    CREATE TABLE inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_no TEXT UNIQUE NOT NULL,
      origin_port TEXT NOT NULL,
      destination_port TEXT NOT NULL,
      container_type TEXT NOT NULL,
      container_count INTEGER NOT NULL,
      sailing_date TEXT,
      customer TEXT NOT NULL,
      cargo_type TEXT NOT NULL,
      cargo_attributes TEXT,
      is_dangerous INTEGER DEFAULT 0,
      dangerous_details TEXT,
      is_refrigerated INTEGER DEFAULT 0,
      refrigerated_details TEXT,
      valid_until TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      remarks TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_no TEXT UNIQUE NOT NULL,
      inquiry_id INTEGER,
      shipping_line TEXT NOT NULL,
      freight_rate REAL NOT NULL,
      currency TEXT NOT NULL,
      surcharges TEXT,
      local_charges TEXT,
      valid_from TEXT NOT NULL,
      valid_until TEXT NOT NULL,
      is_locked INTEGER DEFAULT 0,
      locked_at TEXT,
      locked_by TEXT,
      version INTEGER DEFAULT 1,
      status TEXT DEFAULT 'draft',
      remarks TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
    );

    CREATE TABLE IF NOT EXISTS space_confirmations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      confirmation_no TEXT UNIQUE NOT NULL,
      quotation_id INTEGER,
      vessel TEXT,
      voyage TEXT,
      etd TEXT,
      eta TEXT,
      cut_off_time TEXT,
      port_cut_off_time TEXT,
      status TEXT DEFAULT 'pending',
      confirmed_at TEXT,
      confirmed_by TEXT,
      remarks TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_no TEXT UNIQUE NOT NULL,
      quotation_id INTEGER,
      space_confirmation_id INTEGER,
      customer TEXT NOT NULL,
      operator TEXT,
      status TEXT DEFAULT 'draft',
      cut_off_time TEXT,
      port_cut_off_time TEXT,
      so_no TEXT,
      remarks TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id),
      FOREIGN KEY (space_confirmation_id) REFERENCES space_confirmations(id)
    );

    CREATE TABLE IF NOT EXISTS bill_of_lading (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bl_no TEXT UNIQUE NOT NULL,
      booking_id INTEGER,
      shipper TEXT NOT NULL,
      consignee TEXT NOT NULL,
      notify_party TEXT,
      marks TEXT,
      description TEXT,
      release_type TEXT,
      status TEXT DEFAULT 'draft',
      customer_confirmed INTEGER DEFAULT 0,
      confirmed_at TEXT,
      confirmed_by TEXT,
      remarks TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );

    CREATE TABLE IF NOT EXISTS bl_revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bl_id INTEGER,
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      changed_by TEXT,
      change_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bl_id) REFERENCES bill_of_lading(id)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settlement_no TEXT UNIQUE NOT NULL,
      booking_id INTEGER,
      total_revenue REAL,
      total_cost REAL,
      profit REAL,
      status TEXT DEFAULT 'pending',
      invoiced_at TEXT,
      paid_at TEXT,
      remarks TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );

    CREATE TABLE IF NOT EXISTS settlement_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settlement_id INTEGER,
      item_type TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      is_revenue INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (settlement_id) REFERENCES settlements(id)
    );

    CREATE INDEX IF NOT EXISTS idx_inquiries_no ON inquiries(inquiry_no);
    CREATE INDEX IF NOT EXISTS idx_quotations_no ON quotations(quotation_no);
    CREATE INDEX IF NOT EXISTS idx_bookings_no ON bookings(booking_no);
    CREATE INDEX IF NOT EXISTS idx_bl_no ON bill_of_lading(bl_no);
    CREATE INDEX IF NOT EXISTS idx_settlements_no ON settlements(settlement_no);
  `);
}

module.exports = { db, initDatabase };
