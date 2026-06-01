import Database from 'better-sqlite3';
import path from 'path';
import type { Database as DatabaseType } from 'better-sqlite3';

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const resolvedPath = path.resolve(dbPath);

const db: DatabaseType = new Database(resolvedPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clusters (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      api_server TEXT,
      status TEXT NOT NULL DEFAULT 'healthy',
      node_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS namespaces (
      id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workloads (
      id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL,
      namespace TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      replicas INTEGER DEFAULT 1,
      ready_replicas INTEGER DEFAULT 0,
      image TEXT NOT NULL,
      cpu_request TEXT,
      memory_request TEXT,
      cpu_limit TEXT,
      memory_limit TEXT,
      status TEXT DEFAULT 'Running',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pods (
      id TEXT PRIMARY KEY,
      workload_id TEXT NOT NULL,
      name TEXT NOT NULL,
      namespace TEXT NOT NULL,
      node_name TEXT,
      status TEXT DEFAULT 'Running',
      restart_count INTEGER DEFAULT 0,
      image TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      started_at TEXT,
      FOREIGN KEY (workload_id) REFERENCES workloads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      workload_id TEXT,
      name TEXT NOT NULL,
      namespace TEXT NOT NULL,
      type TEXT DEFAULT 'ClusterIP',
      cluster_ip TEXT,
      ports TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workload_id) REFERENCES workloads(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ingresses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      namespace TEXT NOT NULL,
      host TEXT,
      paths TEXT,
      service_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS config_maps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      namespace TEXT NOT NULL,
      data_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS secrets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      namespace TEXT NOT NULL,
      type TEXT DEFAULT 'Opaque',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL,
      namespace TEXT NOT NULL,
      type TEXT NOT NULL,
      reason TEXT NOT NULL,
      message TEXT,
      object_kind TEXT,
      object_name TEXT,
      count INTEGER DEFAULT 1,
      last_seen TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS release_records (
      id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL,
      namespace TEXT NOT NULL,
      workload_name TEXT NOT NULL,
      old_image TEXT,
      new_image TEXT NOT NULL,
      cpu_limit TEXT,
      memory_limit TEXT,
      health_check INTEGER DEFAULT 1,
      gray_ratio INTEGER DEFAULT 0,
      rollback_point TEXT,
      change_reason TEXT,
      on_duty TEXT,
      status TEXT DEFAULT 'pending',
      approver TEXT,
      operator TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      approved_at TEXT,
      completed_at TEXT,
      FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_release_cluster ON release_records(cluster_id);
    CREATE INDEX IF NOT EXISTS idx_release_status ON release_records(status);

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      cluster_id TEXT,
      namespace TEXT,
      action TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_name TEXT,
      cluster_id TEXT,
      namespace TEXT,
      detail TEXT,
      risk_level TEXT DEFAULT 'low',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inspection_reports (
      id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL,
      report_date TEXT NOT NULL,
      restart_count INTEGER DEFAULT 0,
      pending_pods INTEGER DEFAULT 0,
      oversold_resources INTEGER DEFAULT 0,
      image_pull_failures INTEGER DEFAULT 0,
      high_risk_changes INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 100,
      issues TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'Ready',
      roles TEXT,
      cpu_capacity INTEGER DEFAULT 0,
      cpu_allocatable INTEGER DEFAULT 0,
      cpu_used INTEGER DEFAULT 0,
      memory_capacity INTEGER DEFAULT 0,
      memory_allocatable INTEGER DEFAULT 0,
      memory_used INTEGER DEFAULT 0,
      pod_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL,
      name TEXT NOT NULL,
      namespace TEXT NOT NULL,
      issuer TEXT,
      not_before TEXT,
      not_after TEXT,
      days_remaining INTEGER DEFAULT 0,
      status TEXT DEFAULT 'valid',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_events_cluster ON events(cluster_id);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
    CREATE INDEX IF NOT EXISTS idx_workloads_cluster ON workloads(cluster_id);
    CREATE INDEX IF NOT EXISTS idx_workloads_namespace ON workloads(namespace);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_user ON operation_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_time ON operation_logs(created_at);
  `);
}

createTables();

export default db;
