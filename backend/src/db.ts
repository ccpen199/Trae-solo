import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  const tableInfo = db.prepare("PRAGMA table_info(return_requests)").all() as any[];
  const hasTrackingNumber = tableInfo.some((col: any) => col.name === 'tracking_number');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS return_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform_order_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      return_reason TEXT NOT NULL,
      buyer_description TEXT,
      images TEXT,
      tracking_number TEXT,
      refund_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_review',
      needs_manual_review INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS warehouse_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_request_id INTEGER NOT NULL REFERENCES return_requests(id),
      sku_verified INTEGER NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 1,
      condition_level TEXT NOT NULL DEFAULT 'unknown',
      has_damage INTEGER NOT NULL DEFAULT 0,
      has_wrong_item INTEGER NOT NULL DEFAULT 0,
      has_missing_parts INTEGER NOT NULL DEFAULT 0,
      inspector_notes TEXT,
      inspection_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS processing_decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_request_id INTEGER NOT NULL REFERENCES return_requests(id),
      decision_type TEXT NOT NULL,
      processing_cost REAL NOT NULL DEFAULT 0,
      responsible_party TEXT NOT NULL,
      notes TEXT,
      decided_by TEXT,
      decided_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_request_id INTEGER NOT NULL REFERENCES return_requests(id),
      platform_refund_status TEXT NOT NULL DEFAULT 'pending',
      seller_approved INTEGER NOT NULL DEFAULT 0,
      warehouse_processed INTEGER NOT NULL DEFAULT 0,
      refund_amount REAL NOT NULL,
      refund_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exception_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id INTEGER NOT NULL REFERENCES warehouse_inspections(id),
      exception_type TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      resolved_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_restocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_request_id INTEGER NOT NULL REFERENCES return_requests(id),
      sku TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      condition_level TEXT NOT NULL,
      restock_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      location TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS responsibility_attributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_request_id INTEGER NOT NULL REFERENCES return_requests(id),
      responsible_party TEXT NOT NULL,
      attribution_reason TEXT NOT NULL,
      cost_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  if (!hasTrackingNumber) {
    try {
      db.exec("ALTER TABLE return_requests ADD COLUMN tracking_number TEXT");
      console.log('Added tracking_number column to return_requests');
    } catch (e) {
      // Column might already exist
    }
  }

  const inspectionHasTrackingNumber = (db.prepare("PRAGMA table_info(warehouse_inspections)").all() as any[])
    .some((col: any) => col.name === 'tracking_number');
  
  if (inspectionHasTrackingNumber) {
    try {
      const backupPath = path.join(dataDir, 'app_backup_' + Date.now() + '.sqlite');
      fs.copyFileSync(dbPath, backupPath);
      console.log('Backed up database to', backupPath);
      
      db.exec("ALTER TABLE warehouse_inspections DROP COLUMN tracking_number");
      console.log('Removed tracking_number column from warehouse_inspections');
    } catch (e) {
      // SQLite doesn't support DROP COLUMN in older versions, so we can just leave it
      console.log('Could not drop tracking_number column (SQLite version may not support DROP COLUMN)');
    }
  }

  console.log('Database initialized successfully');
}

export default db;
