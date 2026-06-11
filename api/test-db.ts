import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const db = new Database(path.join(__dirname, 'data.db'))
const users = db.prepare('SELECT id, phone, name FROM users').all()
console.log('Users:', JSON.stringify(users, null, 2))

const user = db.prepare('SELECT id, phone, password, name FROM users WHERE phone = ?').get('13800000001') as any
if (user) {
  console.log('Found user:', user.name)
  console.log('Password match:', bcrypt.compareSync('123456', user.password))
} else {
  console.log('User not found')
}
