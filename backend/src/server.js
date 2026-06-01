require('dotenv').config({ path: '../.env' })

const express = require('express')
const cors = require('cors')
const path = require('path')
const routes = require('./routes')

const app = express()
const PORT = parseInt(process.env.BACKEND_PORT || 56883)
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || 46883)

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use('/api', routes)

app.get('/', (req, res) => {
  res.json({ message: '工业视觉检测管理系统 API' })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`)
  console.log(`API endpoint: http://127.0.0.1:${PORT}/api`)
  console.log(`Health check: http://127.0.0.1:${PORT}/api/health`)
})
