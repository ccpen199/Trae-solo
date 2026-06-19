import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { authRouter } from './routes/auth.routes'
import { taskRouter } from './routes/task.routes'
import { userRouter } from './routes/user.routes'
import { qualityRouter } from './routes/quality.routes'
import { settlementRouter } from './routes/settlement.routes'
import { analyticsRouter } from './routes/analytics.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'AI Data Annotation Platform API is running',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/auth', authRouter)
app.use('/api/tasks', taskRouter)
app.use('/api/users', userRouter)
app.use('/api/quality', qualityRouter)
app.use('/api/settlement', settlementRouter)
app.use('/api/analytics', analyticsRouter)

app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  })
})

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong',
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

export default app
