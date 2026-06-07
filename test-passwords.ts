import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, 'data/app.sqlite'))

console.log('=== 数据库密码验证测试 ===\n')

const users = db.prepare('SELECT id, username, name, role, password_hash FROM users ORDER BY id').all() as any[]

for (const user of users) {
  const testPwd = '123456'
  const result = bcrypt.compareSync(testPwd, user.password_hash)
  console.log(`${String(user.id).padStart(2)} ${user.username.padEnd(10)} ${user.name.padEnd(10)} ${user.role.padEnd(10)} 密码验证: ${result ? '✅ 通过' : '❌ 失败'}`)
}

console.log('\n=== 完成 ===')
db.close()
