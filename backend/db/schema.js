function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_name TEXT,
      contact_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_centers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      brand_id INTEGER REFERENCES brands(id),
      manager_name TEXT,
      manager_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS technicians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      skills TEXT,
      service_area TEXT,
      brand_authorizations TEXT,
      status TEXT DEFAULT 'available',
      service_center_id INTEGER REFERENCES service_centers(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      consumer_name TEXT NOT NULL,
      consumer_phone TEXT,
      product_model TEXT,
      purchase_channel TEXT,
      install_address TEXT,
      appointment_time DATETIME,
      parts_requirements TEXT,
      warranty_status TEXT DEFAULT 'in_warranty',
      status TEXT DEFAULT 'pending',
      brand_id INTEGER REFERENCES brands(id),
      service_center_id INTEGER REFERENCES service_centers(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dispatches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      technician_id INTEGER REFERENCES technicians(id),
      service_center_id INTEGER REFERENCES service_centers(id),
      dispatch_type TEXT DEFAULT 'auto',
      status TEXT DEFAULT 'assigned',
      dispatch_time DATETIME,
      accept_time DATETIME,
      reject_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS on_site_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      technician_id INTEGER REFERENCES technicians(id),
      latitude REAL,
      longitude REAL,
      unboxing_photos TEXT,
      install_steps TEXT,
      auxiliary_charges TEXT,
      user_signature TEXT,
      exception_notes TEXT,
      status TEXT DEFAULT 'in_progress',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      type TEXT,
      description TEXT,
      status TEXT DEFAULT 'open',
      handler_name TEXT,
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      brand_id INTEGER REFERENCES brands(id),
      service_center_id INTEGER REFERENCES service_centers(id),
      technician_id INTEGER REFERENCES technicians(id),
      service_fee REAL,
      auxiliary_fee REAL DEFAULT 0,
      total_fee REAL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = { initSchema };
