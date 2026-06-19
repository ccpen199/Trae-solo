import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.db');

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initTables(dbInstance);
  }
  return dbInstance;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('recycler','producer','inspector','carrier','admin')),
      email TEXT,
      phone TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS enterprises (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
      company_name TEXT NOT NULL,
      unified_social_credit_code TEXT UNIQUE NOT NULL,
      legal_person TEXT NOT NULL,
      legal_person_id TEXT NOT NULL,
      registered_address TEXT NOT NULL,
      business_license_url TEXT NOT NULL,
      qualification_cert_url TEXT,
      waste_management_license_url TEXT,
      verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
      verified_at TEXT,
      credit_rating TEXT,
      credit_score INTEGER,
      region TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recycler_profiles (
      id TEXT PRIMARY KEY,
      enterprise_id TEXT UNIQUE NOT NULL REFERENCES enterprises(id),
      recycling_categories TEXT NOT NULL,
      annual_capacity INTEGER NOT NULL DEFAULT 0,
      main_business_regions TEXT NOT NULL,
      compliance_rate REAL,
      dispute_rate REAL,
      tax_compliance_score INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS producer_profiles (
      id TEXT PRIMARY KEY,
      enterprise_id TEXT UNIQUE NOT NULL REFERENCES enterprises(id),
      industry_type TEXT NOT NULL,
      annual_waste_volume INTEGER NOT NULL DEFAULT 0,
      factory_locations TEXT NOT NULL,
      waste_types TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inspector_profiles (
      id TEXT PRIMARY KEY,
      enterprise_id TEXT UNIQUE NOT NULL REFERENCES enterprises(id),
      cma_cert_no TEXT UNIQUE NOT NULL,
      cma_valid_until TEXT NOT NULL,
      inspection_scope TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS carrier_profiles (
      id TEXT PRIMARY KEY,
      enterprise_id TEXT UNIQUE NOT NULL REFERENCES enterprises(id),
      carrier_license_no TEXT UNIQUE NOT NULL,
      vehicle_count INTEGER NOT NULL DEFAULT 0,
      service_regions TEXT NOT NULL,
      api_provider TEXT CHECK (api_provider IN ('中储运','德邦','自有')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS business_opportunities (
      id TEXT PRIMARY KEY,
      publisher_id TEXT NOT NULL REFERENCES users(id),
      publisher_enterprise_id TEXT NOT NULL REFERENCES enterprises(id),
      type TEXT NOT NULL CHECK (type IN ('supply','demand')),
      category TEXT NOT NULL CHECK (category IN ('废金属','二手设备','废塑料')),
      sub_category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT '吨',
      min_price REAL NOT NULL,
      max_price REAL NOT NULL,
      price_unit TEXT NOT NULL DEFAULT '元/吨',
      region TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      quality_grade TEXT,
      available_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','matched','closed','expired')),
      views_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_opp_category ON business_opportunities(category);
    CREATE INDEX IF NOT EXISTS idx_opp_type ON business_opportunities(type);
    CREATE INDEX IF NOT EXISTS idx_opp_region ON business_opportunities(region);
    CREATE INDEX IF NOT EXISTS idx_opp_status ON business_opportunities(status);

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      categories TEXT NOT NULL,
      regions TEXT NOT NULL,
      min_quantity REAL,
      max_quantity REAL,
      min_price REAL,
      max_price REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS negotiations (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL REFERENCES business_opportunities(id),
      initiator_id TEXT NOT NULL REFERENCES users(id),
      responder_id TEXT NOT NULL REFERENCES users(id),
      current_price REAL NOT NULL,
      current_quantity REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','accepted','rejected','cancelled')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS negotiation_messages (
      id TEXT PRIMARY KEY,
      negotiation_id TEXT NOT NULL REFERENCES negotiations(id),
      sender_id TEXT NOT NULL REFERENCES users(id),
      price REAL,
      quantity REAL,
      message TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      negotiation_id TEXT NOT NULL REFERENCES negotiations(id),
      opportunity_id TEXT NOT NULL REFERENCES business_opportunities(id),
      buyer_id TEXT NOT NULL REFERENCES users(id),
      seller_id TEXT NOT NULL REFERENCES users(id),
      category TEXT NOT NULL,
      sub_category TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      unit_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      deposit_ratio REAL NOT NULL DEFAULT 0.2,
      deposit_amount REAL NOT NULL,
      quality_standard TEXT NOT NULL,
      delivery_method TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      delivery_date TEXT NOT NULL,
      inspection_method TEXT NOT NULL,
      payment_terms TEXT NOT NULL,
      breach_clause TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','signed_buyer','signed_seller','fully_signed','terminated')),
      buyer_signed_at TEXT,
      seller_signed_at TEXT,
      buyer_signature_url TEXT,
      seller_signature_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      contract_id TEXT UNIQUE NOT NULL REFERENCES contracts(id),
      buyer_id TEXT NOT NULL REFERENCES users(id),
      seller_id TEXT NOT NULL REFERENCES users(id),
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','negotiating','contracted','deposit_paid','shipping','inspecting','completed','cancelled','disputed')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payment_records (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      type TEXT NOT NULL CHECK (type IN ('deposit','full_payment','refund','compensation')),
      amount REAL NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending','deposit_frozen','deposit_released','full_paid','refunded')),
      frozen_at TEXT,
      released_at TEXT,
      transaction_no TEXT,
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS logistics_quotations (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      carrier_id TEXT NOT NULL REFERENCES users(id),
      carrier_enterprise_id TEXT NOT NULL REFERENCES enterprises(id),
      pickup_address TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      distance_km REAL NOT NULL,
      weight_ton REAL NOT NULL,
      vehicle_type TEXT NOT NULL,
      quoted_price REAL NOT NULL,
      estimated_days INTEGER NOT NULL,
      insurance_fee REAL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired')),
      created_at TEXT DEFAULT (datetime('now')),
      expired_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS logistics_orders (
      id TEXT PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL REFERENCES orders(id),
      quotation_id TEXT UNIQUE NOT NULL REFERENCES logistics_quotations(id),
      carrier_id TEXT NOT NULL REFERENCES users(id),
      tracking_no TEXT NOT NULL,
      vehicle_no TEXT,
      driver_name TEXT,
      driver_phone TEXT,
      status TEXT NOT NULL DEFAULT 'pending_pickup' CHECK (status IN ('pending_pickup','picked_up','in_transit','delivered','exception')),
      current_location TEXT,
      estimated_arrival TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS logistics_events (
      id TEXT PRIMARY KEY,
      logistics_order_id TEXT NOT NULL REFERENCES logistics_orders(id),
      status TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      event_time TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inspection_reports (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      inspector_id TEXT NOT NULL REFERENCES users(id),
      inspector_enterprise_id TEXT NOT NULL REFERENCES enterprises(id),
      report_no TEXT UNIQUE NOT NULL,
      cma_report_no TEXT,
      inspection_date TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT NOT NULL,
      sample_weight REAL NOT NULL,
      quality_grade TEXT NOT NULL,
      composition TEXT NOT NULL,
      impurity_rate REAL NOT NULL,
      moisture_rate REAL NOT NULL,
      photos TEXT,
      conclusion TEXT NOT NULL,
      is_passed INTEGER NOT NULL DEFAULT 1,
      api_sync_status TEXT CHECK (api_sync_status IN ('pending','synced','failed')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trace_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      order_id TEXT NOT NULL REFERENCES orders(id),
      producer_id TEXT NOT NULL REFERENCES users(id),
      recycler_id TEXT NOT NULL REFERENCES users(id),
      category TEXT NOT NULL,
      sub_category TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated','in_transit','received','processed','archived')),
      min_env_sync_status TEXT CHECK (min_env_sync_status IN ('pending','synced','failed')),
      min_env_tracking_no TEXT,
      origin_address TEXT NOT NULL,
      current_address TEXT,
      destination_address TEXT NOT NULL,
      inspection_report_id TEXT REFERENCES inspection_reports(id),
      qr_code_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trace_events (
      id TEXT PRIMARY KEY,
      trace_code_id TEXT NOT NULL REFERENCES trace_codes(id),
      event_type TEXT NOT NULL,
      location TEXT NOT NULL,
      operator TEXT NOT NULL,
      description TEXT NOT NULL,
      event_time TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS credit_ratings (
      id TEXT PRIMARY KEY,
      enterprise_id TEXT NOT NULL REFERENCES enterprises(id),
      total_orders INTEGER NOT NULL DEFAULT 0,
      completed_orders INTEGER NOT NULL DEFAULT 0,
      performance_rate REAL NOT NULL DEFAULT 0,
      dispute_rate REAL NOT NULL DEFAULT 0,
      dispute_count INTEGER NOT NULL DEFAULT 0,
      tax_compliance_score INTEGER NOT NULL DEFAULT 0,
      quality_objection_rate REAL NOT NULL DEFAULT 0,
      quality_objection_count INTEGER NOT NULL DEFAULT 0,
      payment_timeliness_score INTEGER NOT NULL DEFAULT 0,
      data_completeness_score INTEGER NOT NULL DEFAULT 0,
      final_score INTEGER NOT NULL DEFAULT 0,
      final_grade TEXT NOT NULL,
      calculated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS heatmap_data (
      id TEXT PRIMARY KEY,
      region TEXT NOT NULL,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT NOT NULL,
      supply_volume REAL NOT NULL DEFAULT 0,
      demand_volume REAL NOT NULL DEFAULT 0,
      avg_price REAL NOT NULL DEFAULT 0,
      price_change_pct REAL NOT NULL DEFAULT 0,
      steel_mill_capacity REAL,
      steel_mill_utilization REAL,
      record_date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_heatmap_date ON heatmap_data(record_date);
    CREATE INDEX IF NOT EXISTS idx_heatmap_category ON heatmap_data(category);

    CREATE TABLE IF NOT EXISTS price_forecasts (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      sub_category TEXT NOT NULL,
      region TEXT NOT NULL,
      current_price REAL NOT NULL,
      forecast_price_7d REAL NOT NULL,
      forecast_price_30d REAL NOT NULL,
      confidence_7d REAL NOT NULL,
      confidence_30d REAL NOT NULL,
      factors TEXT NOT NULL,
      forecast_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK (type IN ('opportunity','negotiation','contract','order','payment','logistics','system')),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      related_id TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
  `);
}
