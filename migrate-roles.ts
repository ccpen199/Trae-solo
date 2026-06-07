import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'data/app.sqlite')

console.log('Database path:', dbPath)
console.log('Exists:', fs.existsSync(dbPath))

const db = new Database(dbPath)

try {
  db.exec('PRAGMA foreign_keys = OFF')
  db.exec('BEGIN TRANSACTION')

  console.log('\n1. 重建 users 表...')
  
  db.exec(`
    CREATE TABLE users_new (
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

  console.log('  Copied rows:', db.changes)

  db.exec('DROP TABLE users')
  db.exec('ALTER TABLE users_new RENAME TO users')

  db.exec('CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')

  console.log('\n2. 插入新账号...')
  const password = '123456'
  const passwordHash = bcrypt.hashSync(password, 10)

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users 
    (username, password_hash, name, phone, role, org_id, cert_status, real_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const usersToAdd = [
    ['admin', '系统管理员', '13900000000', 'admin'],
    ['platform', '平台运营', '13900000001', 'platform'],
    ['ops', '运维工程师', '13900000002', 'ops']
  ]

  for (const [username, name, phone, role] of usersToAdd) {
    const result = insertUser.run(username, passwordHash, name, phone, role, 1, 'certified', name)
    console.log(`  - ${username}: ${result.changes > 0 ? 'INSERTED' : 'EXISTS'}`)
  }

  console.log('\n3. 重建 commission_rules 表...')
  db.exec(`
    CREATE TABLE commission_rules_new (
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

  console.log('\n4. 插入新角色佣金规则...')
  const insertRule = db.prepare(`
    INSERT OR IGNORE INTO commission_rules (org_id, role, rate)
    VALUES (?, ?, ?)
  `)
  insertRule.run(1, 'admin', 0.0000)
  insertRule.run(1, 'platform', 0.0050)
  insertRule.run(1, 'ops', 0.0000)

  db.exec('COMMIT')
  db.exec('PRAGMA foreign_keys = ON')

  console.log('\n5. 验证结果:')
  const users = db.prepare('SELECT id, username, name, role, cert_status FROM users ORDER BY id').all() as any[]
  for (const u of users) {
    console.log(`   ${String(u.id).padStart(2)} ${u.username.padEnd(10)} ${u.name.padEnd(10)} ${u.role.padEnd(10)} ${u.cert_status}`)
  }

  console.log('\n✅ 迁移成功完成！')
  console.log('   新账号密码均为: 123456')
} catch (err: any) {
  db.exec('ROLLBACK')
  console.error('\n❌ 迁移失败:', err.message)
  console.error(err.stack)
  process.exit(1)
} finally {
  db.close()
}
