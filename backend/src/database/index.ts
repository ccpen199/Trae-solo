import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    const dbDir = path.dirname(config.database.path);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    dbInstance = new Database(config.database.path);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('synchronous = NORMAL');
    dbInstance.pragma('foreign_keys = ON');
    
    initializeSchema(dbInstance);
  }
  return dbInstance;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      base_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OFFLINE',
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS apis (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      method TEXT NOT NULL,
      description TEXT,
      timeout INTEGER DEFAULT 30000,
      is_public INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      rate_limit INTEGER DEFAULT 1000,
      rate_window INTEGER DEFAULT 60,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rate_limit_rules (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      api_id TEXT,
      name TEXT NOT NULL,
      limit_type TEXT NOT NULL DEFAULT 'GLOBAL',
      requests_per_second REAL NOT NULL DEFAULT 100,
      burst_size INTEGER DEFAULT 200,
      window_size INTEGER DEFAULT 60,
      is_enabled INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      FOREIGN KEY (api_id) REFERENCES apis(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS circuit_breaker_rules (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      api_id TEXT,
      name TEXT NOT NULL,
      failure_threshold REAL NOT NULL DEFAULT 0.5,
      timeout INTEGER NOT NULL DEFAULT 10000,
      reset_timeout INTEGER NOT NULL DEFAULT 30000,
      min_requests INTEGER DEFAULT 10,
      is_enabled INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      FOREIGN KEY (api_id) REFERENCES apis(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS circuit_breaker_states (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      api_id TEXT,
      state TEXT NOT NULL DEFAULT 'CLOSED',
      failure_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      last_failure_time INTEGER,
      open_time INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      FOREIGN KEY (api_id) REFERENCES apis(id) ON DELETE CASCADE,
      UNIQUE(service_id, api_id)
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      trace_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      api_id TEXT,
      api_key_id TEXT,
      request_fingerprint TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      request_headers TEXT,
      request_body TEXT,
      response_headers TEXT,
      response_body TEXT,
      error_message TEXT,
      client_ip TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_call_logs_trace_id ON call_logs(trace_id);
    CREATE INDEX IF NOT EXISTS idx_call_logs_service_id ON call_logs(service_id);
    CREATE INDEX IF NOT EXISTS idx_call_logs_fingerprint ON call_logs(request_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at);

    CREATE TABLE IF NOT EXISTS metrics (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      api_id TEXT,
      metric_type TEXT NOT NULL,
      value REAL NOT NULL,
      sample_count INTEGER NOT NULL DEFAULT 1,
      window_start INTEGER NOT NULL,
      window_end INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_metrics_service_id ON metrics(service_id);
    CREATE INDEX IF NOT EXISTS idx_metrics_window ON metrics(window_start, window_end);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      operation_type TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      actor_id TEXT NOT NULL,
      actor_type TEXT NOT NULL DEFAULT 'USER',
      old_value TEXT,
      new_value TEXT,
      request_ip TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);

    CREATE TABLE IF NOT EXISTS configuration_changes (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      change_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      old_config TEXT,
      new_config TEXT,
      changed_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      deployed_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'WARNING',
      service_id TEXT NOT NULL,
      api_id TEXT,
      message TEXT NOT NULL,
      is_acknowledged INTEGER DEFAULT 0,
      acknowledged_by TEXT,
      acknowledged_at INTEGER,
      metadata TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_service_id ON alerts(service_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
  `);
}

export { Database };
