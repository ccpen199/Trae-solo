import { Database } from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'freight.db');
export const db = new Database(dbPath);

export function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`PRAGMA journal_mode = WAL`);
      db.run(`PRAGMA foreign_keys = ON`);

      db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        qualifications TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS vessels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        imo TEXT UNIQUE,
        type TEXT NOT NULL,
        dwt REAL,
        teu INTEGER,
        built_year INTEGER,
        flag TEXT,
        speed REAL,
        status TEXT DEFAULT 'available',
        owner_id TEXT,
        current_port TEXT,
        latitude REAL,
        longitude REAL,
        specs TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS voyages (
        id TEXT PRIMARY KEY,
        vessel_id TEXT NOT NULL,
        voyage_number TEXT NOT NULL,
        origin_port TEXT NOT NULL,
        destination_port TEXT NOT NULL,
        etd DATETIME NOT NULL,
        eta DATETIME NOT NULL,
        status TEXT DEFAULT 'published',
        available_teu INTEGER,
        available_weight REAL,
        container_types TEXT,
        base_rate REAL,
        carbon_estimate REAL,
        compliance_certificates TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vessel_id) REFERENCES vessels(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS cargo_bookings (
        id TEXT PRIMARY KEY,
        cargo_owner_id TEXT NOT NULL,
        voyage_id TEXT,
        cargo_type TEXT NOT NULL,
        weight REAL NOT NULL,
        teu INTEGER NOT NULL,
        origin_port TEXT NOT NULL,
        destination_port TEXT NOT NULL,
        earliest_departure DATETIME,
        latest_arrival DATETIME,
        budget_rate REAL,
        status TEXT DEFAULT 'inquiry',
        special_requirements TEXT,
        compliance_docs TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cargo_owner_id) REFERENCES users(id),
        FOREIGN KEY (voyage_id) REFERENCES voyages(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS vessel_listings (
        id TEXT PRIMARY KEY,
        vessel_id TEXT NOT NULL UNIQUE,
        seller_id TEXT NOT NULL,
        price REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        description TEXT,
        status TEXT DEFAULT 'active',
        due_diligence_docs TEXT,
        inspection_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vessel_id) REFERENCES vessels(id),
        FOREIGN KEY (seller_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS negotiation_records (
        id TEXT PRIMARY KEY,
        listing_id TEXT NOT NULL,
        buyer_id TEXT NOT NULL,
        proposed_price REAL NOT NULL,
        counter_price REAL,
        status TEXT DEFAULT 'pending',
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listing_id) REFERENCES vessel_listings(id),
        FOREIGN KEY (buyer_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS containers (
        id TEXT PRIMARY KEY,
        container_number TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        size TEXT NOT NULL,
        teu INTEGER DEFAULT 1,
        max_weight REAL,
        status TEXT DEFAULT 'available',
        current_location TEXT,
        operator_id TEXT,
        features TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS liner_schedules (
        id TEXT PRIMARY KEY,
        route_code TEXT NOT NULL,
        origin_port TEXT NOT NULL,
        destination_port TEXT NOT NULL,
        departure_day TEXT NOT NULL,
        transit_days INTEGER NOT NULL,
        vessel_type TEXT,
        standard_rate REAL,
        operator_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS spot_containers (
        id TEXT PRIMARY KEY,
        schedule_id TEXT,
        container_id TEXT NOT NULL,
        departure_date DATETIME NOT NULL,
        arrival_date DATETIME NOT NULL,
        original_price REAL,
        flash_price REAL,
        flash_start DATETIME,
        flash_end DATETIME,
        status TEXT DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES liner_schedules(id),
        FOREIGN KEY (container_id) REFERENCES containers(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS bid_slots (
        id TEXT PRIMARY KEY,
        voyage_id TEXT NOT NULL,
        slot_count INTEGER NOT NULL,
        start_price REAL,
        current_price REAL,
        bid_start DATETIME,
        bid_end DATETIME,
        status TEXT DEFAULT 'upcoming',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (voyage_id) REFERENCES voyages(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS special_equipment (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        model TEXT,
        parameters TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        status TEXT DEFAULT 'available',
        daily_rate REAL,
        location TEXT,
        certificates TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS rental_orders (
        id TEXT PRIMARY KEY,
        equipment_id TEXT NOT NULL,
        renter_id TEXT NOT NULL,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        total_price REAL,
        status TEXT DEFAULT 'pending',
        delivery_address TEXT,
        monitoring_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES special_equipment(id),
        FOREIGN KEY (renter_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        cargo_booking_id TEXT,
        spot_container_id TEXT,
        bid_slot_id TEXT,
        buyer_id TEXT NOT NULL,
        seller_id TEXT NOT NULL,
        order_type TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'inquiry',
        contract_signed BOOLEAN DEFAULT 0,
        bill_of_lading TEXT,
        tracking_data TEXT,
        payment_status TEXT DEFAULT 'unpaid',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cargo_booking_id) REFERENCES cargo_bookings(id),
        FOREIGN KEY (spot_container_id) REFERENCES spot_containers(id),
        FOREIGN KEY (bid_slot_id) REFERENCES bid_slots(id),
        FOREIGN KEY (buyer_id) REFERENCES users(id),
        FOREIGN KEY (seller_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS tracking_events (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        location TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        geo_data TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS freight_index (
        id TEXT PRIMARY KEY,
        route TEXT NOT NULL,
        index_value REAL NOT NULL,
        date DATE NOT NULL,
        container_type TEXT DEFAULT 'dry',
        UNIQUE(route, date, container_type)
      )`);

      resolve();
    });
  });
}
