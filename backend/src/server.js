require('dotenv').config({ path: '../.env' })
const express = require('express')
const cors = require('cors')
const path = require('path')
const { initDatabase } = require('./database')

const projectsRouter = require('./routes/projects')
const applicationsRouter = require('./routes/applications')
const auditRouter = require('./routes/audit')
const paymentRouter = require('./routes/payment')
const authRouter = require('./routes/auth')

const app = express()
const PORT = process.env.BACKEND_PORT || 58898

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '政府资金拨付管理系统 API 运行正常' })
})

app.use('/api/projects', projectsRouter)
app.use('/api/applications', applicationsRouter)
app.use('/api/audit', auditRouter)
app.use('/api/payment', paymentRouter)
app.use('/api/auth', authRouter)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: '服务器内部错误' })
})

initDatabase()

app.listen(PORT, '127.0.0.1', () => {
  console.log(`服务器运行在 http://127.0.0.1:${PORT}`)
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`)
})
