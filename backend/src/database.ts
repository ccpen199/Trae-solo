import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = path.join(__dirname, '..', '..', 'data', 'app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db: DatabaseType = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      real_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      role TEXT NOT NULL,
      avatar TEXT,
      store_id TEXT,
      city TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT,
      longitude REAL,
      latitude REAL,
      service_radius REAL DEFAULT 50,
      manager_id TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manager_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS decoration_demands (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT,
      address TEXT,
      house_type TEXT,
      area REAL,
      budget_min REAL,
      budget_max REAL,
      decoration_style TEXT,
      requirement_desc TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ai_solutions (
      id TEXT PRIMARY KEY,
      demand_id TEXT NOT NULL,
      style_plan TEXT,
      layout_plan TEXT,
      material_plan TEXT,
      estimated_budget REAL,
      estimated_period INTEGER,
      renderings TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (demand_id) REFERENCES decoration_demands(id)
    );

    CREATE TABLE IF NOT EXISTS designer_matches (
      id TEXT PRIMARY KEY,
      demand_id TEXT NOT NULL,
      designer_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      match_score REAL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (demand_id) REFERENCES decoration_demands(id),
      FOREIGN KEY (designer_id) REFERENCES users(id),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS decoration_contracts (
      id TEXT PRIMARY KEY,
      demand_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      designer_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      contract_no TEXT UNIQUE NOT NULL,
      total_amount REAL NOT NULL,
      escrow_amount REAL NOT NULL,
      start_date TEXT,
      end_date TEXT,
      warranty_years INTEGER DEFAULT 10,
      terms TEXT,
      status TEXT DEFAULT 'draft',
      owner_signed_at TEXT,
      store_signed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (demand_id) REFERENCES decoration_demands(id),
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (designer_id) REFERENCES users(id),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS project_milestones (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      milestone_type TEXT NOT NULL,
      planned_date TEXT,
      actual_date TEXT,
      status TEXT DEFAULT 'pending',
      owner_confirmed INTEGER DEFAULT 0,
      designer_confirmed INTEGER DEFAULT 0,
      supervisor_confirmed INTEGER DEFAULT 0,
      payment_amount REAL NOT NULL,
      payment_status TEXT DEFAULT 'pending',
      paid_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES decoration_contracts(id)
    );

    CREATE TABLE IF NOT EXISTS payment_records (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      milestone_id TEXT,
      amount REAL NOT NULL,
      payment_type TEXT NOT NULL,
      payee_role TEXT NOT NULL,
      payee_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      transaction_no TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES decoration_contracts(id),
      FOREIGN KEY (milestone_id) REFERENCES project_milestones(id)
    );

    CREATE TABLE IF NOT EXISTS ai_supervision_records (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      camera_id TEXT,
      detection_time TEXT NOT NULL,
      risk_type TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      description TEXT,
      screenshot_url TEXT,
      status TEXT DEFAULT 'detected',
      handled_by TEXT,
      handled_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES decoration_contracts(id),
      FOREIGN KEY (handled_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS showroom_models (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      style TEXT,
      model_url TEXT,
      thumbnail_url TEXT,
      description TEXT,
      store_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS electronic_contracts (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      hash TEXT NOT NULL,
      blockchain_tx TEXT,
      storage_url TEXT,
      expire_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES decoration_contracts(id)
    );

    CREATE TABLE IF NOT EXISTS material_bom (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      material_name TEXT NOT NULL,
      specification TEXT,
      quantity REAL,
      unit TEXT,
      unit_price REAL,
      total_price REAL,
      supplier_id TEXT,
      status TEXT DEFAULT 'planned',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES decoration_contracts(id),
      FOREIGN KEY (supplier_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      contract_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      submitter_id TEXT NOT NULL,
      handler_id TEXT,
      status TEXT DEFAULT 'pending',
      nps_score INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      FOREIGN KEY (contract_id) REFERENCES decoration_contracts(id),
      FOREIGN KEY (submitter_id) REFERENCES users(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS nps_records (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      feedback TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES decoration_contracts(id),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      province TEXT,
      longitude REAL,
      latitude REAL,
      store_count INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_demands_owner ON decoration_demands(owner_id);
    CREATE INDEX IF NOT EXISTS idx_demands_city ON decoration_demands(city);
    CREATE INDEX IF NOT EXISTS idx_contracts_owner ON decoration_contracts(owner_id);
    CREATE INDEX IF NOT EXISTS idx_contracts_status ON decoration_contracts(status);
    CREATE INDEX IF NOT EXISTS idx_milestones_contract ON project_milestones(contract_id);
    CREATE INDEX IF NOT EXISTS idx_supervision_contract ON ai_supervision_records(contract_id);
    CREATE INDEX IF NOT EXISTS idx_bom_contract ON material_bom(contract_id);
    CREATE INDEX IF NOT EXISTS idx_workorders_status ON work_orders(status);
  `);

  console.log('Database initialized successfully');
}
