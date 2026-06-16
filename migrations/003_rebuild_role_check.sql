-- 扩展 users 表的 role CHECK 约束到 7 角色
-- 002 迁移已通过 ALTER TABLE 添加了 status/license_verified，但 role 限制仍为 4 角色
-- SQLite 不支持 ALTER COLUMN 修改 CHECK，故需重建表

PRAGMA foreign_keys = OFF;

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

INSERT OR IGNORE INTO users_new (id, role, phone, password_hash, nickname, avatar, status, license_verified, created_at)
SELECT id, role, phone, password_hash, nickname, avatar, status, license_verified, created_at FROM users;

DROP TABLE IF EXISTS users;
ALTER TABLE users_new RENAME TO users;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
