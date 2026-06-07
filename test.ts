console.log('Test output')
import db from './api/db.js'
console.log('DB loaded')
const users = db.prepare('SELECT COUNT(*) as count FROM users').get()
console.log('Users count:', users.count)
