const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'developer',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS repositories (
      id TEXT PRIMARY KEY,
      main_order_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      owner_id TEXT NOT NULL,
      responsible_id TEXT,
      expected_finish_time INTEGER,
      status TEXT NOT NULL DEFAULT 'pending_create',
      is_public INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (responsible_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      repository_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_protected INTEGER DEFAULT 0,
      latest_commit TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (repository_id) REFERENCES repositories(id)
    );

    CREATE TABLE IF NOT EXISTS commits (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      message TEXT NOT NULL,
      author_id TEXT NOT NULL,
      commit_hash TEXT NOT NULL,
      parent_hash TEXT,
      status TEXT NOT NULL DEFAULT 'pending_submit',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS merge_requests (
      id TEXT PRIMARY KEY,
      main_order_no TEXT UNIQUE NOT NULL,
      repository_id TEXT NOT NULL,
      source_branch_id TEXT NOT NULL,
      target_branch_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      author_id TEXT NOT NULL,
      reviewer_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending_review',
      is_locked INTEGER DEFAULT 0,
      locked_by TEXT,
      locked_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (repository_id) REFERENCES repositories(id),
      FOREIGN KEY (source_branch_id) REFERENCES branches(id),
      FOREIGN KEY (target_branch_id) REFERENCES branches(id),
      FOREIGN KEY (author_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id),
      FOREIGN KEY (locked_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      uploaded_by TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS status_history (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      action TEXT,
      comment TEXT,
      actor_id TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (actor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      recipient_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT NOT NULL DEFAULT 'todo',
      is_read INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (recipient_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      repository_id TEXT,
      permission_level TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (repository_id) REFERENCES repositories(id)
    );

    CREATE TABLE IF NOT EXISTS ci_pipelines (
      id TEXT PRIMARY KEY,
      merge_request_id TEXT,
      repository_id TEXT NOT NULL,
      commit_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      stage TEXT NOT NULL DEFAULT 'build',
      start_time INTEGER,
      end_time INTEGER,
      exit_code INTEGER,
      logs TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (merge_request_id) REFERENCES merge_requests(id),
      FOREIGN KEY (repository_id) REFERENCES repositories(id),
      FOREIGN KEY (commit_id) REFERENCES commits(id)
    );

    CREATE TABLE IF NOT EXISTS deployments (
      id TEXT PRIMARY KEY,
      pipeline_id TEXT NOT NULL,
      repository_id TEXT NOT NULL,
      environment TEXT NOT NULL,
      version TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      previous_version TEXT,
      rollback_available INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (pipeline_id) REFERENCES ci_pipelines(id),
      FOREIGN KEY (repository_id) REFERENCES repositories(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (actor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      config TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      rule_id TEXT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'warning',
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      suppressed_until INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      resolved_at INTEGER,
      FOREIGN KEY (rule_id) REFERENCES rules(id)
    );

    CREATE INDEX IF NOT EXISTS idx_repositories_status ON repositories(status);
    CREATE INDEX IF NOT EXISTS idx_repositories_owner ON repositories(owner_id);
    CREATE INDEX IF NOT EXISTS idx_merge_requests_status ON merge_requests(status);
    CREATE INDEX IF NOT EXISTS idx_merge_requests_reviewer ON merge_requests(reviewer_id);
    CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_status_history_entity ON status_history(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
  `);

  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, email, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const { v4: uuidv4 } = require('uuid');
    
    insertUser.run(uuidv4(), 'admin', hashedPassword, 'admin@example.com', 'admin');
    
    insertUser.run(uuidv4(), 'developer', hashedPassword, 'developer@example.com', 'developer');
    insertUser.run(uuidv4(), 'reviewer', hashedPassword, 'reviewer@example.com', 'reviewer');
    insertUser.run(uuidv4(), 'devops', hashedPassword, 'devops@example.com', 'devops');
  }

  const defaultRules = db.prepare('SELECT id FROM rules WHERE name = ?').get('branch_protection');
  if (!defaultRules) {
    const { v4: uuidv4 } = require('uuid');
    
    const insertRule = db.prepare(`
      INSERT INTO rules (id, name, rule_type, config)
      VALUES (?, ?, ?, ?)
    `);
    
    insertRule.run(
      uuidv4(),
      'branch_protection',
      'repository',
      JSON.stringify({
        protectedBranches: ['main', 'master'],
        requireReview: true,
        minimumApprovals: 1,
        requireStatusChecks: true
      })
    );

    insertRule.run(
      uuidv4(),
      'ci_retry_policy',
      'ci',
      JSON.stringify({
        maxRetries: 3,
        retryOnExitCodes: [1, 255],
        retryDelaySeconds: 30
      })
    );

    insertRule.run(
      uuidv4(),
      'alert_thresholds',
      'alert',
      JSON.stringify({
        buildFailureThreshold: 3,
        deploymentFailureThreshold: 2,
        alertStormThreshold: 10,
        alertStormWindowMinutes: 5
      })
    );
  }
};

initDatabase();

module.exports = db;
