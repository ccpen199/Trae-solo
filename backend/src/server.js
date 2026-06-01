require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

require('./utils/db')

const app = express()
const PORT = parseInt(process.env.BACKEND_PORT) || 58816

app.use(cors({ origin: `http://127.0.0.1:${parseInt(process.env.FRONTEND_PORT) || 48816}` }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/users', require('./routes/users'))
app.use('/api/projects', require('./routes/projects'))
app.use('/api/tasks', require('./routes/tasks'))
app.use('/api/settlements', require('./routes/settlements'))
app.use('/api/payments', require('./routes/payments'))
app.use('/api/vouchers', require('./routes/vouchers'))
app.use('/api/rules', require('./routes/rules'))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.get('/api/stats', (req, res) => {
  const db = require('./utils/db')
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
    const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get()
    const settlementCount = db.prepare('SELECT COUNT(*) as count FROM settlements').get()
    const paymentCount = db.prepare('SELECT COUNT(*) as count FROM payments').get()
    res.json({
      users: userCount.count,
      tasks: taskCount.count,
      settlements: settlementCount.count,
      payments: paymentCount.count
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const routesPath = path.join(__dirname, 'routes')
if (!fs.existsSync(routesPath)) {
  fs.mkdirSync(routesPath, { recursive: true })
}

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`)
})
