const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'app.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      build_number TEXT NOT NULL,
      git_commit TEXT NOT NULL,
      environment TEXT NOT NULL,
      release_notes TEXT,
      static_resource_url TEXT,
      backend_dependency_version TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT DEFAULT 'system'
    );

    CREATE TABLE IF NOT EXISTS gray_strategies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      user_whitelist TEXT,
      tenant_whitelist TEXT,
      region_whitelist TEXT,
      browser_whitelist TEXT,
      traffic_percentage INTEGER DEFAULT 0,
      start_time DATETIME,
      end_time DATETIME,
      status TEXT DEFAULT 'draft',
      created_by TEXT DEFAULT 'system',
      updated_by TEXT DEFAULT 'system',
      hit_scope_snapshot TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (version_id) REFERENCES app_versions(id)
    );

    CREATE TABLE IF NOT EXISTS release_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      strategy_id INTEGER NOT NULL,
      phase TEXT NOT NULL,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      operator TEXT NOT NULL,
      metric_threshold TEXT,
      check_result TEXT,
      pause_reason TEXT,
      resume_reason TEXT,
      status TEXT DEFAULT 'running',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (strategy_id) REFERENCES gray_strategies(id)
    );

    CREATE TABLE IF NOT EXISTS monitor_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      strategy_id INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      pv INTEGER DEFAULT 0,
      uv INTEGER DEFAULT 0,
      js_errors INTEGER DEFAULT 0,
      api_errors INTEGER DEFAULT 0,
      white_screen_rate REAL DEFAULT 0,
      core_conversion REAL DEFAULT 0,
      user_feedback_score REAL DEFAULT 0,
      is_anomaly INTEGER DEFAULT 0,
      FOREIGN KEY (strategy_id) REFERENCES gray_strategies(id)
    );

    CREATE TABLE IF NOT EXISTS rollback_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      strategy_id INTEGER NOT NULL,
      rollback_type TEXT NOT NULL,
      target_version_id INTEGER,
      reason TEXT NOT NULL,
      verification_result TEXT,
      operator TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (strategy_id) REFERENCES gray_strategies(id),
      FOREIGN KEY (target_version_id) REFERENCES app_versions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_versions_env ON app_versions(environment);
    CREATE INDEX IF NOT EXISTS idx_strategies_version ON gray_strategies(version_id);
    CREATE INDEX IF NOT EXISTS idx_strategies_status ON gray_strategies(status);
    CREATE INDEX IF NOT EXISTS idx_releases_strategy ON release_records(strategy_id);
    CREATE INDEX IF NOT EXISTS idx_metrics_strategy ON monitor_metrics(strategy_id);
    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON monitor_metrics(timestamp);
    CREATE INDEX IF NOT EXISTS idx_rollbacks_strategy ON rollback_records(strategy_id);
  `);

  const columns = db.prepare("PRAGMA table_info(gray_strategies)").all();
  const colNames = columns.map(c => c.name);
  if (!colNames.includes('created_by')) {
    db.exec("ALTER TABLE gray_strategies ADD COLUMN created_by TEXT DEFAULT 'system'");
  }
  if (!colNames.includes('updated_by')) {
    db.exec("ALTER TABLE gray_strategies ADD COLUMN updated_by TEXT DEFAULT 'system'");
  }
  if (!colNames.includes('hit_scope_snapshot')) {
    db.exec("ALTER TABLE gray_strategies ADD COLUMN hit_scope_snapshot TEXT");
  }
}

module.exports = { db, init };