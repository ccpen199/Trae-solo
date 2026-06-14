import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'

import userRoutes from './routes/userRoutes'
import skillRoutes from './routes/skillRoutes'
import taskRoutes from './routes/taskRoutes'
import bidRoutes from './routes/bidRoutes'
import milestoneRoutes from './routes/milestoneRoutes'
import paymentRoutes from './routes/paymentRoutes'
import riskRoutes from './routes/riskRoutes'
import adminRoutes from './routes/adminRoutes'
import collaborationRoutes from './routes/collaborationRoutes'
import fileVersionRoutes from './routes/fileVersionRoutes'
import { refreshDemoData } from './utils/refreshData'

const app = express()
const HOST = process.env.HOST || '127.0.0.1'
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59183)

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const uploadDir = process.env.UPLOAD_DIR || 'uploads'
app.use('/uploads', express.static(path.join(process.cwd(), uploadDir)))

app.use('/api/users', userRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/bids', bidRoutes)
app.use('/api/milestones', milestoneRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/risk', riskRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/collaborations', collaborationRoutes)
app.use('/api/file-versions', fileVersionRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '创意服务众包平台 API 运行正常' })
})

app.get('/api/teachers', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'provider-ui-001', name: '林澈', role: 'UI设计服务商', specialty: '品牌视觉与移动端界面', rating: 4.9 },
      { id: 'provider-dev-001', name: '周宁', role: '小程序开发服务商', specialty: '微信小程序与后台接口', rating: 4.8 },
    ],
  })
})

app.get('/api/courses', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'guide-001', title: '雇主需求拆解指南', category: 'task-planning', lessons: 6 },
      { id: 'guide-002', title: '服务商投标方案模板', category: 'proposal', lessons: 5 },
    ],
  })
})

app.get('/api/bookings', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'booking-001', service: '需求顾问预约', status: 'confirmed', scheduledAt: '2026-06-13 15:00' },
      { id: 'booking-002', service: '争议仲裁排期', status: 'pending', scheduledAt: '2026-06-14 10:30' },
    ],
  })
})

app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    data: {
      items: [
        { id: 'escrow-001', task: '品牌官网视觉设计', status: '里程碑托管中', amount: 6800 },
        { id: 'escrow-002', task: '短视频脚本策划', status: '待验收', amount: 1200 },
      ],
      total: 2,
    },
  })
})

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: '服务器内部错误' })
})

const server = app.listen(PORT, HOST, async () => {
  console.log(`服务器运行在 http://${HOST}:${PORT}`)
  console.log(`上传目录: ${path.join(process.cwd(), uploadDir)}`)
  setTimeout(() => {
    refreshDemoData().catch(e => console.error('自动刷新数据失败:', e))
  }, 1500)
})

process.on('SIGTERM', () => {
  server.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  server.close(() => process.exit(0))
})

export default app
