import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import postRoutes from './routes/posts'
import questionRoutes from './routes/questions'
import activityRoutes from './routes/activities'
import petRoutes from './routes/pets'
import messageRoutes from './routes/messages'

const app = express()
const PORT = 48341

app.use(cors({
  origin: ['http://localhost:48342', 'http://127.0.0.1:48342'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '宠爱宠物社交平台 API 运行正常' })
})

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/pets', petRoutes)
app.use('/api/messages', messageRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' })
})

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err)
  res.status(500).json({ success: false, message: '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log(`🚀 宠爱宠物社交平台 后端服务启动成功`)
  console.log(`📍 后端地址: http://localhost:${PORT}`)
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`)
})
