import db from './index.js';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export function initDatabase(): void {
  db.exec(`
    -- 用户表（人员核心数据）
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'collaborator', 'compliance')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'locked')),
      storage_quota INTEGER DEFAULT 10737418240,
      storage_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    -- 文件主对象表（核心对象）
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      parent_id TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT,
      file_size INTEGER NOT NULL DEFAULT 0,
      md5_hash TEXT,
      sha256_hash TEXT,
      is_folder INTEGER DEFAULT 0 CHECK(is_folder IN (0, 1)),
      is_encrypted INTEGER DEFAULT 0 CHECK(is_encrypted IN (0, 1)),
      encryption_key_id TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'deleted', 'pending')),
      version_count INTEGER DEFAULT 1,
      current_version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accessed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES files(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
    CREATE INDEX IF NOT EXISTS idx_files_parent_id ON files(parent_id);
    CREATE INDEX IF NOT EXISTS idx_files_md5_hash ON files(md5_hash);
    CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
    CREATE INDEX IF NOT EXISTS idx_files_file_path ON files(file_path);

    -- 文件分片表（明细对象 - Block-Storage 引擎）
    CREATE TABLE IF NOT EXISTS file_chunks (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      chunk_size INTEGER NOT NULL,
      chunk_md5 TEXT,
      storage_path TEXT NOT NULL,
      is_encrypted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_file_chunks_file_id ON file_chunks(file_id);
    CREATE INDEX IF NOT EXISTS idx_file_chunks_file_index ON file_chunks(file_id, chunk_index);

    -- 文件版本表（明细对象 - Version-Controller 引擎）
    CREATE TABLE IF NOT EXISTS file_versions (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      md5_hash TEXT,
      storage_path TEXT NOT NULL,
      is_encrypted INTEGER DEFAULT 0,
      change_description TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_current INTEGER DEFAULT 0 CHECK(is_current IN (0, 1)),
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
    CREATE INDEX IF NOT EXISTS idx_file_versions_version ON file_versions(file_id, version_number);

    -- 分享链接表（凭证核心数据 - Sharing-Link 引擎）
    CREATE TABLE IF NOT EXISTS share_links (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      share_code TEXT UNIQUE NOT NULL,
      encryption_key TEXT NOT NULL,
      share_type TEXT DEFAULT 'public' CHECK(share_type IN ('public', 'private', 'password')),
      password_hash TEXT,
      expire_at DATETIME,
      max_access_count INTEGER,
      access_count INTEGER DEFAULT 0,
      download_count INTEGER DEFAULT 0,
      allowed_ips TEXT,
      allowed_domains TEXT,
      access_fence_enabled INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'revoked', 'disabled')),
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_share_links_code ON share_links(share_code);
    CREATE INDEX IF NOT EXISTS idx_share_links_file_id ON share_links(file_id);
    CREATE INDEX IF NOT EXISTS idx_share_links_status ON share_links(status);
    CREATE INDEX IF NOT EXISTS idx_share_links_expire ON share_links(expire_at);

    -- 分享访问明细表（追溯核心数据）
    CREATE TABLE IF NOT EXISTS share_access_logs (
      id TEXT PRIMARY KEY,
      share_link_id TEXT NOT NULL,
      file_id TEXT NOT NULL,
      access_type TEXT CHECK(access_type IN ('view', 'download', 'preview')),
      access_ip TEXT,
      access_user_agent TEXT,
      access_location TEXT,
      access_status TEXT DEFAULT 'success' CHECK(access_status IN ('success', 'denied', 'failed', 'expired')),
      deny_reason TEXT,
      accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accessed_by TEXT,
      FOREIGN KEY (share_link_id) REFERENCES share_links(id) ON DELETE CASCADE,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (accessed_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_share_access_logs_link ON share_access_logs(share_link_id);
    CREATE INDEX IF NOT EXISTS idx_share_access_logs_file ON share_access_logs(file_id);
    CREATE INDEX IF NOT EXISTS idx_share_access_logs_time ON share_access_logs(accessed_at);

    -- 文件权限表（人员与对象关系）
    CREATE TABLE IF NOT EXISTS file_permissions (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      permission TEXT NOT NULL CHECK(permission IN ('read', 'write', 'delete', 'share', 'admin')),
      granted_by TEXT NOT NULL,
      granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'revoked', 'expired')),
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(file_id, user_id, permission)
    );

    CREATE INDEX IF NOT EXISTS idx_file_permissions_file ON file_permissions(file_id);
    CREATE INDEX IF NOT EXISTS idx_file_permissions_user ON file_permissions(user_id);

    -- 加密密钥表（凭证核心数据 - Encryption-Vault 引擎）
    CREATE TABLE IF NOT EXISTS encryption_keys (
      id TEXT PRIMARY KEY,
      key_name TEXT NOT NULL,
      key_type TEXT DEFAULT 'aes-256-gcm' CHECK(key_type IN ('aes-256-gcm', 'aes-128-cbc', 'rsa-2048')),
      encrypted_key TEXT NOT NULL,
      iv TEXT,
      associated_data TEXT,
      owner_id TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      rotated_at DATETIME,
      previous_key_id TEXT,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_encryption_keys_owner ON encryption_keys(owner_id);

    -- 下载记录表（流量与状态监控）
    CREATE TABLE IF NOT EXISTS download_records (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      version_id TEXT,
      user_id TEXT,
      share_link_id TEXT,
      download_ip TEXT NOT NULL,
      user_agent TEXT,
      file_size INTEGER NOT NULL,
      download_time_ms INTEGER,
      download_speed_bps REAL,
      status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'failed', 'interrupted', 'rate_limited')),
      error_message TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES file_versions(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (share_link_id) REFERENCES share_links(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_download_records_file ON download_records(file_id);
    CREATE INDEX IF NOT EXISTS idx_download_records_user ON download_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_download_records_time ON download_records(started_at);
    CREATE INDEX IF NOT EXISTS idx_download_records_status ON download_records(status);

    -- 审计日志表（全链路追溯核心）
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      action_category TEXT NOT NULL CHECK(action_category IN (
        'file_upload', 'file_download', 'file_edit', 'file_delete',
        'file_share', 'file_restore', 'file_archive',
        'permission_change', 'version_change',
        'user_login', 'user_logout', 'admin_action',
        'security_event', 'system_event'
      )),
      target_type TEXT CHECK(target_type IN ('file', 'folder', 'user', 'share_link', 'permission', 'version')),
      target_id TEXT,
      logical_trace TEXT,
      physical_trace TEXT,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      status TEXT DEFAULT 'success' CHECK(status IN ('success', 'failed', 'warning')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(action_category);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(created_at);

    -- 存储监控表（状态与容量）
    CREATE TABLE IF NOT EXISTS storage_metrics (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      total_files INTEGER DEFAULT 0,
      total_folders INTEGER DEFAULT 0,
      storage_used INTEGER DEFAULT 0,
      storage_quota INTEGER DEFAULT 10737418240,
      archived_files INTEGER DEFAULT 0,
      archived_size INTEGER DEFAULT 0,
      version_count INTEGER DEFAULT 0,
      version_storage_used INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      active_share_count INTEGER DEFAULT 0,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_storage_metrics_user ON storage_metrics(user_id);
    CREATE INDEX IF NOT EXISTS idx_storage_metrics_time ON storage_metrics(recorded_at);

    -- 上传会话表（分片上传状态追踪）
    CREATE TABLE IF NOT EXISTS upload_sessions (
      id TEXT PRIMARY KEY,
      file_id TEXT,
      user_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      total_chunks INTEGER NOT NULL,
      uploaded_chunks INTEGER DEFAULT 0,
      chunk_size INTEGER NOT NULL,
      md5_hash TEXT,
      status TEXT DEFAULT 'uploading' CHECK(status IN ('uploading', 'completed', 'failed', 'paused', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_upload_sessions_user ON upload_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(status);

    -- 已上传分片表
    CREATE TABLE IF NOT EXISTS uploaded_chunks (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      chunk_size INTEGER NOT NULL,
      chunk_md5 TEXT,
      storage_path TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES upload_sessions(id) ON DELETE CASCADE,
      UNIQUE(session_id, chunk_index)
    );

    CREATE INDEX IF NOT EXISTS idx_uploaded_chunks_session ON uploaded_chunks(session_id);

    -- 会话表（凭证核心数据）
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expires_at);
  `);

  console.log('数据库表初始化完成');
}

export function initSeedData(): void {
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin') as { count: number };
  
  if (adminCount.count === 0) {
    const defaultPassword = 'admin123';
    const passwordHash = createHash('sha256').update(defaultPassword).digest('hex');
    
    const adminId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, username, password_hash, email, role, status, storage_quota)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      adminId,
      'admin',
      passwordHash,
      'admin@example.com',
      'admin',
      'active',
      107374182400
    );
    
    const userPasswordHash = createHash('sha256').update('user123').digest('hex');
    const userId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, username, password_hash, email, role, status, storage_quota)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      'user1',
      userPasswordHash,
      'user1@example.com',
      'user',
      'active',
      10737418240
    );
    
    db.prepare(`
      INSERT INTO storage_metrics (id, user_id, storage_quota)
      VALUES (?, ?, ?)
    `).run(uuidv4(), adminId, 107374182400);
    
    db.prepare(`
      INSERT INTO storage_metrics (id, user_id, storage_quota)
      VALUES (?, ?, ?)
    `).run(uuidv4(), userId, 10737418240);
    
    console.log('种子数据初始化完成');
    console.log('默认管理员账号: admin / admin123');
    console.log('默认普通用户账号: user1 / user123');
  }
}
