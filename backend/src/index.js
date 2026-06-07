import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true })

import authRoutes from './routes/auth.js'
import shipperRoutes from './routes/shipper.js'
import driverRoutes from './routes/driver.js'
import waybillRoutes from './routes/waybill.js'
import paymentRoutes from './routes/payment.js'
import adminRoutes from './routes/admin.js'

const app = express()
const PORT = parseInt(process.env.BACKEND_PORT) || 58933

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 48933}`, `http://localhost:${process.env.FRONTEND_PORT || 48933}`],
  credentials: true
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

const uploadDir = path.resolve('../uploads')
if (fs.existsSync(uploadDir)) {
  app.use('/uploads', express.static(uploadDir))
}

app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'ok', data: { timestamp: new Date().toISOString() } })
})

app.use('/api/auth', authRoutes)
app.use('/api/shipper', shipperRoutes)
app.use('/api/driver', driverRoutes)
app.use('/api/waybill', waybillRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/admin', adminRoutes)

app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ code: 500, message: err.message || '服务器内部错误' })
})

app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 后端服务启动成功`)
  console.log(`📍 监听地址: http://127.0.0.1:${PORT}`)
  console.log(`🔍 健康检查: http://127.0.0.1:${PORT}/api/health`)
})
