-- 升级 users 表：扩展角色、新增状态和资质字段
-- 依赖 initDatabase 在迁移期间关闭 foreign_keys，避免外键冲突

CREATE TABLE IF NOT EXISTS users_new (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('owner', 'doctor', 'hospital', 'merchant', 'admin', 'platform', 'ops')),
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'pending_review')),
  license_verified INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO users_new (id, role, phone, password_hash, nickname, avatar, created_at)
SELECT id, role, phone, password_hash, nickname, avatar, created_at FROM users;

DROP TABLE IF EXISTS users;
ALTER TABLE users_new RENAME TO users;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
