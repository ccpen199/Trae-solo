const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

class DB {
  constructor() {
    this.init();
  }

  init() {
    const dbDir = path.dirname(config.db.path);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(config.db.path);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.createTables();
  }

  createTables() {
    const tables = {
      users: `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          role TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `,
      products: `
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          base_premium REAL NOT NULL DEFAULT 0,
          risk_factors TEXT,
          status TEXT DEFAULT 'draft',
          coverage_details TEXT,
          exclusions TEXT,
          created_by TEXT NOT NULL,
          approved_by TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (approved_by) REFERENCES users(id)
        )
      `,
      policies: `
        CREATE TABLE IF NOT EXISTS policies (
          id TEXT PRIMARY KEY,
          policy_number TEXT UNIQUE NOT NULL,
          product_id TEXT NOT NULL,
          policyholder_id TEXT NOT NULL,
          agent_id TEXT,
          premium_amount REAL NOT NULL,
          sum_assured REAL NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          status TEXT DEFAULT 'draft',
          health_declaration TEXT,
          risk_score REAL,
          underwriting_result TEXT,
          underwritten_at TEXT,
          underwritten_by TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id),
          FOREIGN KEY (policyholder_id) REFERENCES users(id),
          FOREIGN KEY (agent_id) REFERENCES users(id),
          FOREIGN KEY (underwritten_by) REFERENCES users(id)
        )
      `,
      claims: `
        CREATE TABLE IF NOT EXISTS claims (
          id TEXT PRIMARY KEY,
          claim_number TEXT UNIQUE NOT NULL,
          policy_id TEXT NOT NULL,
          claimant_id TEXT NOT NULL,
          incident_date TEXT NOT NULL,
          incident_description TEXT,
          claim_amount REAL NOT NULL,
          approved_amount REAL,
          status TEXT DEFAULT 'pending',
          site_snapshots TEXT,
          fingerprint_result TEXT,
          compliance_result TEXT,
          claim_engine_result TEXT,
          assigned_to TEXT,
          escalated_to TEXT,
          escalated_at TEXT,
          escalated_reason TEXT,
          rejected_reason TEXT,
          payment_transaction_id TEXT,
          paid_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (policy_id) REFERENCES policies(id),
          FOREIGN KEY (claimant_id) REFERENCES users(id),
          FOREIGN KEY (assigned_to) REFERENCES users(id),
          FOREIGN KEY (escalated_to) REFERENCES users(id)
        )
      `,
      audit_logs: `
        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          action TEXT NOT NULL,
          actor_id TEXT,
          actor_role TEXT,
          details TEXT,
          status TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (actor_id) REFERENCES users(id)
        )
      `,
      notifications: `
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT,
          type TEXT NOT NULL,
          entity_type TEXT,
          entity_id TEXT,
          read_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `,
      workflow_timers: `
        CREATE TABLE IF NOT EXISTS workflow_timers (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          timer_type TEXT NOT NULL,
          deadline TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          triggered_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
    };

    for (const [name, sql] of Object.entries(tables)) {
      this.db.exec(sql);
    }

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
      CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON policies(policy_number);
      CREATE INDEX IF NOT EXISTS idx_policies_policyholder ON policies(policyholder_id);
      CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
      CREATE INDEX IF NOT EXISTS idx_claims_claim_number ON claims(claim_number);
      CREATE INDEX IF NOT EXISTS idx_claims_policy ON claims(policy_id);
      CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
      CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
      CREATE INDEX IF NOT EXISTS idx_workflow_timers ON workflow_timers(deadline, status);
    `);
  }

  prepare(sql) {
    return this.db.prepare(sql);
  }

  exec(sql) {
    return this.db.exec(sql);
  }

  transaction(fn) {
    return this.db.transaction(fn);
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

const db = new DB();
module.exports = db;
