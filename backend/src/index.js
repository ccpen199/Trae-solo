require('dotenv').config({ path: '../../.env' })
const express = require('express')
const cors = require('cors')
const path = require('path')

const reportsRoute = require('./routes/reports')
const queriesRoute = require('./routes/queries')
const auditRoute = require('./routes/audit')
const datasourcesRoute = require('./routes/datasources')

const app = express()
const PORT = process.env.BACKEND_PORT || 58807

app.use(cors())
app.use(express.json())

app.use('/api/reports', reportsRoute)
app.use('/api/queries', queriesRoute)
app.use('/api/audit', auditRoute)
app.use('/api/datasources', datasourcesRoute)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const exportsDir = path.join(__dirname, '../../exports')
app.use('/exports', express.static(exportsDir))

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`)
})

module.exports = app
