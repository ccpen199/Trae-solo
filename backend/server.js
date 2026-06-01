require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.BACKEND_PORT || 56825;

app.use(cors({ origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 46825}` }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_no TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'created',
      shipper_name TEXT NOT NULL,
      shipper_phone TEXT,
      shipper_address TEXT,
      consignee_name TEXT NOT NULL,
      consignee_phone TEXT,
      consignee_address TEXT,
      pieces INTEGER NOT NULL,
      weight REAL NOT NULL,
      length REAL,
      width REAL,
      height REAL,
      volume_weight REAL,
      chargeable_weight REAL,
      product_name TEXT NOT NULL,
      is_dangerous BOOLEAN DEFAULT 0,
      is_battery BOOLEAN DEFAULT 0,
      dangerous_approved BOOLEAN DEFAULT 0,
      dangerous_approved_by TEXT,
      dangerous_approved_at DATETIME,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      flight_no TEXT,
      flight_date DATE,
      service_level TEXT DEFAULT 'standard',
      master_waybill TEXT,
      house_waybill TEXT,
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS warehouse_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_id INTEGER NOT NULL,
      actual_pieces INTEGER,
      actual_weight REAL,
      actual_length REAL,
      actual_width REAL,
      actual_height REAL,
      dimension_photo TEXT,
      weight_photo TEXT,
      exception_photo TEXT,
      exception_note TEXT,
      received_by TEXT,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    );

    CREATE TABLE IF NOT EXISTS security_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_id INTEGER NOT NULL,
      check_result TEXT NOT NULL,
      check_note TEXT,
      checked_by TEXT NOT NULL,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      xray_photo TEXT,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    );

    CREATE TABLE IF NOT EXISTS waybill_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      master_waybill TEXT,
      house_waybill TEXT,
      flight_no TEXT,
      flight_date DATE,
      pieces INTEGER,
      weight REAL,
      change_type TEXT NOT NULL,
      change_reason TEXT,
      changed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    );

    CREATE TABLE IF NOT EXISTS flight_statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_id INTEGER NOT NULL,
      status_code TEXT NOT NULL,
      status_name TEXT NOT NULL,
      status_time DATETIME NOT NULL,
      location TEXT,
      remark TEXT,
      notify_customer BOOLEAN DEFAULT 0,
      notified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    );

    CREATE TABLE IF NOT EXISTS charges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_id INTEGER NOT NULL,
      charge_type TEXT NOT NULL,
      charge_name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'CNY',
      charge_weight REAL,
      unit_price REAL,
      is_verified BOOLEAN DEFAULT 0,
      verified_by TEXT,
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    );

    CREATE TABLE IF NOT EXISTS operations_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_id INTEGER,
      operation TEXT NOT NULL,
      operator TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_id INTEGER NOT NULL,
      subscriber_name TEXT NOT NULL,
      subscriber_email TEXT,
      subscriber_phone TEXT,
      notify_departed BOOLEAN DEFAULT 1,
      notify_arrived BOOLEAN DEFAULT 1,
      notify_cleared BOOLEAN DEFAULT 1,
      notify_available BOOLEAN DEFAULT 1,
      notify_delivered BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER,
      shipment_id INTEGER NOT NULL,
      status_code TEXT NOT NULL,
      status_name TEXT NOT NULL,
      notification_type TEXT DEFAULT 'email',
      recipient TEXT,
      content TEXT,
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    );
  `);

  const indexStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name=?");
  if (!indexStmt.get('idx_shipment_no')) {
    db.exec("CREATE UNIQUE INDEX idx_shipment_no ON shipments(shipment_no)");
  }
}

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/warehouse', require('./routes/warehouse'));
app.use('/api/security', require('./routes/security'));
app.use('/api/flight-status', require('./routes/flightstatus'));
app.use('/api/charges', require('./routes/charges'));
app.use('/api/subscriptions', require('./routes/subscriptions').router);

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});

module.exports = { db, app };
