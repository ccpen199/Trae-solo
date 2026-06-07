import dotenv from 'dotenv'
dotenv.config({ override: true })

import cors from 'cors'
import express from 'express'
import { db, getOverview } from './database.js'
import candidatesRouter from './routes/candidates.js'
import jobsRouter from './routes/jobs.js'
import headhunterRouter from './routes/headhunter.js'
import interviewsRouter from './routes/interviews.js'
import analyticsRouter from './routes/analytics.js'
import campusRouter from './routes/campus.js'
import adminRouter from './routes/admin.js'

const app = express()
const frontendPort = process.env.FRONTEND_PORT || '48839'
const backendPort = Number(process.env.BACKEND_PORT || 58839)

app.use(express.json())
app.use(cors({
  origin: `http://127.0.0.1:${frontendPort}`,
  credentials: true
}))

app.get('/api/health', (_req, res) => {
  const dbOk = db.prepare('SELECT 1 AS ok').get().ok === 1
  res.json({
    status: 'ok',
    project: process.env.PROJECT_NAME || 'may-88839',
    db: dbOk ? 'connected' : 'error',
    timestamp: Date.now()
  })
})

app.get('/api/overview', (_req, res) => {
  res.json(getOverview())
})

app.use('/api/candidates', candidatesRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/headhunter', headhunterRouter)
app.use('/api/interviews', interviewsRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/campus', campusRouter)
app.use('/api/admin', adminRouter)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found' })
})

const server = app.listen(backendPort, '127.0.0.1', () => {
  console.log(`API ready on http://127.0.0.1:${backendPort}`)
})

function shutdown(signal) {
  console.log(`${signal} received`)
  server.close(() => {
    db.close()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
