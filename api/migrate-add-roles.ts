#!/usr/bin/env node
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../data/app.sqlite')
const db = new Database(dbPath)

try {
  db.exec('BEGIN TRANSACTION')

  console.log('1. 检查 users 表结构...')
  const checkOld = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='users'`).get()
  console.log('当前 schema:', (checkOld as any)?.sql?.substring(0, 200))

  console.log('\n2. 重建 users 表以支持新角色...')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('director','manager','agent','admin','platform','ops')) DEFAULT 'agent',
      org_id INTEGER REFERENCES organizations(id),
      cert_status TEXT DEFAULT 'pending' CHECK(cert_status IN ('pending','certified','rejected')),
      real_name TEXT,
      id_card TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    INSERT INTO users_new 
    SELECT id, username, password_hash, name, phone, role, org_id, cert_status, real_name, id_card, avatar, created_at, updated_at
    FROM users
  `)

  db.exec('DROP TABLE users')
  db.exec('ALTER TABLE users_new RENAME TO users')

  console.log('3. 重建索引...')
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')

  console.log('\n4. 插入新账号 (admin, platform, ops)...')
  const password = '123456'
  const passwordHash = bcrypt.hashSync(password, 10)

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users 
    (username, password_hash, name, phone, role, org_id, cert_status, real_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const superOrgId = 1

  const result1 = insertUser.run(
    'admin', passwordHash, '系统管理员', '13900000000', 'admin', superOrgId, 'certified', '系统管理员'
  )
  console.log('   - admin:', result1.changes > 0 ? '已插入' : '已存在')

  const result2 = insertUser.run(
    'platform', passwordHash, '平台运营', '13900000001', 'platform', superOrgId, 'certified', '平台运营'
  )
  console.log('   - platform:', result2.changes > 0 ? '已插入' : '已存在')

  const result3 = insertUser.run(
    'ops', passwordHash, '运维工程师', '13900000002', 'ops', superOrgId, 'certified', '运维工程师'
  )
  console.log('   - ops:', result3.changes > 0 ? '已插入' : '已存在')

  console.log('\n5. 更新 commission_rules 表支持新角色...')
  db.exec(`
    CREATE TABLE IF NOT EXISTS commission_rules_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER NOT NULL REFERENCES organizations(id),
      role TEXT NOT NULL CHECK(role IN ('director','manager','agent','admin','platform','ops')),
      rate DECIMAL(5,4) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  db.exec(`
    INSERT INTO commission_rules_new 
    SELECT id, org_id, role, rate, created_at FROM commission_rules
  `)
  db.exec('DROP TABLE commission_rules')
  db.exec('ALTER TABLE commission_rules_new RENAME TO commission_rules')

  console.log('\n6. 插入新角色的佣金规则...')
  const insertRule = db.prepare(`
    INSERT OR IGNORE INTO commission_rules (org_id, role, rate)
    VALUES (?, ?, ?)
  `)
  insertRule.run(superOrgId, 'admin', 0.0000)
  insertRule.run(superOrgId, 'platform', 0.0050)
  insertRule.run(superOrgId, 'ops', 0.0000)

  db.exec('COMMIT')

  console.log('\n7. 验证新账号...')
  const users = db.prepare(`SELECT id, username, name, role, cert_status FROM users WHERE role IN ('admin','platform','ops')`).all()
  console.log('新账号列表:')
  for (const u of users as any[]) {
    console.log(`   - ${u.username} (${u.name}, 角色: ${u.role}, 认证: ${u.cert_status})`)
  }

  console.log('\n✅ 迁移完成！新账号密码均为: 123456')
} catch (err: any) {
  db.exec('ROLLBACK')
  console.error('❌ 迁移失败:', err.message)
  process.exit(1)
} finally {
  db.close()
}
