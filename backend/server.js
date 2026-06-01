require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const DB_SCHEMA = require('./db/schema')
const db = DB_SCHEMA.getDb()
DB_SCHEMA.init(db)

const PORT = parseInt(process.env.BACKEND_PORT || '56393', 10)
const HOST = '127.0.0.1'

const app = express()

const FE_PORT = process.env.FRONTEND_PORT || '44393'
app.use(cors({
  origin: `http://127.0.0.1:${FE_PORT}`,
  credentials: true
}))
app.use(express.json({ limit: '4mb' }))
app.use(express.urlencoded({ extended: true, limit: '4mb' }))

app.use((req, res, next) => {
  req.db = db
  next()
})

app.use('/api/auth', require('./routes/auth'))
app.use('/api/dashboard', require('./routes/dashboard'))
app.use('/api/applications', require('./routes/applications'))
app.use('/api/configs', require('./routes/configs'))
app.use('/api/tasks', require('./routes/tasks'))
app.use('/api/logs', require('./routes/logs'))
app.use('/api/change-orders', require('./routes/change_orders'))
app.use('/api/alerts', require('./routes/alerts'))
app.use('/api/audits', require('./routes/audits'))
app.use('/api/catalog', require('./routes/catalog'))
app.use('/api/permissions', require('./routes/permissions'))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  console.error('[ERR]', err)
  res.status(500).json({ code: 500, message: err.message || 'Internal Server Error' })
})

// Uploads dir
const UPLOAD_DIR = path.join(__dirname, 'data', 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

app.use('/uploads', express.static(UPLOAD_DIR))

// Check port occupied then start
const net = require('net')

async function findPort(base, host) {
  for (let i = 0; i < 50; i++) {
    const port = base + i * 1000
    const ok = await new Promise(resolve => {
      const s = net.createServer()
      s.once('error', () => resolve(false))
      s.once('listening', () => { s.close(); resolve(true) })
      s.listen(port, host)
    })
    if (ok) return port
  }
  throw new Error('no free port')
}

async function start() {
  const bePort = await findPort(PORT, HOST)
  const envPath = path.join(__dirname, '..', '.env')
  let env = {}
  try {
    const content = fs.readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const [k, ...v] = line.split('=')
      if (k && v.length) env[k.trim()] = v.join('=').trim()
    }
  } catch (e) {}
  env.BACKEND_PORT = String(bePort)
  const newEnv = Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n')
  fs.writeFileSync(envPath, newEnv)

  // update vite.config.js
  const vitePath = path.join(__dirname, '..', 'frontend', 'vite.config.js')
  try {
    let vite = fs.readFileSync(vitePath, 'utf-8')
    vite = vite.replace(/target: 'http:\/\/127\.0\.0\.1:\d+'/, `target: 'http://127.0.0.1:${bePort}'`)
    fs.writeFileSync(vitePath, vite)
  } catch (e) {}

  app.listen(bePort, HOST, () => {
    console.log(`Backend running on http://${HOST}:${bePort}`)
    console.log(`API base: http://${HOST}:${bePort}/api`)
    console.log(`Ports synced to .env and vite.config.js`)
  })
}
start()
