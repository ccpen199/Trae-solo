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

const app = express()
const PORT = process.env.PORT || 3001

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '创意服务众包平台 API 运行正常' })
})

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
  console.log(`📁 上传目录: ${path.join(process.cwd(), uploadDir)}`)
})

export default app
