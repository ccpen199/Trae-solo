import express from 'express'
import cors from 'cors'

const app = express()
const host = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1'
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59111)
const corsOrigin = process.env.CORS_ORIGIN || 'http://127.0.0.1:49111'

app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json())

const auditLog = []

app.use((req, res, next) => {
  const entry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  }
  auditLog.push(entry)
  console.log(`[AUDIT] ${entry.timestamp} ${entry.method} ${entry.path} from ${entry.ip}`)
  next()
})

app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    todayApplications: 158392,
    totalApplications: 287000000,
    avgProcessingTime: 2.3,
    timeoutRate: 0.87,
    complaints: 127,
    apiCalls: 3285671,
    onlineUsers: 12847,
    authCount: 58392,
    authSuccessRate: 99.7,
    blockedLogins: 127,
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    service: 'gov-digital-foundation-api',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/auth/stats', (req, res) => {
  res.json({
    onlineUsers: 12847,
    todayAuth: 58392,
    successRate: 99.7,
    blockedAttempts: 127,
  })
})

app.get('/api/items/list', (req, res) => {
  res.json({
    total: 12586,
    national: 1203,
    provincial: 8942,
    municipal: 2441,
  })
})

app.get('/api/seal/stats', (req, res) => {
  res.json({
    total: 3256,
    active: 2891,
    pending: 43,
    revoked: 322,
  })
})

app.get('/api/license/stats', (req, res) => {
  res.json({
    total: 8562341,
    todayIssued: 2347,
    crossDomainShared: 1205,
    verificationCount: 15892,
  })
})

app.get('/api/data-sharing/stats', (req, res) => {
  res.json({
    themes: 256,
    publishedApis: 1893,
    todayCalls: 328567,
    desensitizationRules: 47,
  })
})

app.get('/api/portal/stats', (req, res) => {
  res.json({
    connectedProvinces: 31,
    serviceEntries: 12856,
    dailyVisits: 2847392,
    recommendationHitRate: 89.3,
  })
})

app.get('/api/monitor/realtime', (req, res) => {
  res.json({
    cpu: Math.floor(60 + Math.random() * 20),
    memory: Math.floor(65 + Math.random() * 15),
    bandwidth: Math.floor(40 + Math.random() * 20),
    dbConnections: Math.floor(120 + Math.random() * 80),
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/audit-log', (req, res) => {
  res.json({
    total: auditLog.length,
    records: auditLog.slice(-100).reverse(),
  })
})

app.get('/api/compliance/check', (req, res) => {
  res.json({
    level3Protection: { status: 'passed', lastCheck: '2026-06-09T08:00:00Z' },
    commercialCrypto: { status: 'passed', lastCheck: '2026-06-09T08:00:00Z' },
    auditLog: { status: 'normal', lastCheck: '2026-06-09T08:00:00Z' },
    dataBackup: { status: 'normal', lastCheck: '2026-06-09T06:00:00Z' },
  })
})

app.listen(port, host, () => {
  console.log(`[Gov Digital Foundation API] Server running on http://${host}:${port}`)
  console.log(`[等保三级] Security compliance API active`)
  console.log(`[商密评估] Commercial cryptography API active`)
})
