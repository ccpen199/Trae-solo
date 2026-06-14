import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { initDatabase } from './models/schema'
import { initSeedData } from './seed/initData'
import { success, error } from './utils/response'

import tradesRouter from './routes/trades'
import workersRouter from './routes/workers'
import jobsRouter from './routes/jobs'
import matchesRouter from './routes/matches'
import contractsRouter from './routes/contracts'
import wagePaymentsRouter from './routes/wagePayments'
import employersRouter from './routes/employers'
import analyticsRouter from './routes/analytics'

const PROJECT_DIR = path.resolve(__dirname, '../../..')
dotenv.config({ path: path.join(PROJECT_DIR, '.env') })
const TAIL4 = process.env.TAIL4 || '9080'
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '49080')
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '59080')
const PORT = BACKEND_PORT
const HOST = process.env.HOST || '127.0.0.1'

function getCorsOrigins(): string[] {
  const tail4 = parseInt(TAIL4)
  const origins: string[] = []
  for (let slot = 0; slot < 6; slot++) {
    const port = 40000 + slot * 1000 + tail4
    origins.push(`http://127.0.0.1:${port}`)
    origins.push(`http://localhost:${port}`)
  }
  return origins
}

function checkPort(port: number, label: string): void {
  const { execSync } = require('child_process')
  try {
    const pid = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null | head -n1`, { encoding: 'utf8' }).trim()
    if (pid) {
      let cwd = ''
      try {
        cwd = execSync(`lsof -a -p ${pid} -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1`, { encoding: 'utf8' }).trim()
      } catch (e) {
        cwd = ''
      }
      const cmd = execSync(`ps -o command= -p ${pid} 2>/dev/null`, { encoding: 'utf8' }).trim()
      
      if (cwd.startsWith(PROJECT_DIR) || cmd.includes(PROJECT_DIR)) {
        console.log(`[Port Check] ${label} port ${port} is used by current project (PID: ${pid}), killing...`)
        process.kill(parseInt(pid))
        return
      }
      
      console.log(`[Port Check] ${label} port ${port} is occupied by another process:`)
      console.log(`  PID: ${pid}`)
      console.log(`  CWD: ${cwd}`)
      console.log(`  Command: ${cmd}`)
      console.log(`  Cannot kill process from other project, please try alternative ports.`)
      process.exit(1)
    }
  } catch (e) {
    // Port is free
  }
}

const args = process.argv.slice(2)
if (!args.includes('--skip-port-check')) {
  checkPort(FRONTEND_PORT, 'Frontend')
  checkPort(BACKEND_PORT, 'Backend')
}

const app = express()

const CORS_ORIGINS = getCorsOrigins()
app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

app.get('/api/health', (req: Request, res: Response) => {
  success(res, {
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    project: 'ConstructionLaborPlatform',
    port: PORT
  })
})

const currentUser = {
  id: 1,
  name: '劳务监管员',
  role: 'admin',
  organization: '住建劳务供需监管中心',
  permissions: ['workers', 'jobs', 'matches', 'contracts', 'payments', 'analytics']
}

app.get('/api/auth/me', (req: Request, res: Response) => {
  success(res, { user: currentUser })
})

app.get('/api/user/profile', (req: Request, res: Response) => {
  success(res, { user: currentUser, profile: currentUser })
})

app.get('/api/users/profile', (req: Request, res: Response) => {
  success(res, { user: currentUser, profile: currentUser })
})

app.get('/api/admin/stats', (req: Request, res: Response) => {
  success(res, {
    module: 'admin',
    totalWorkers: (require('./utils/db').runQueryOne('SELECT COUNT(*) as count FROM workers')?.count) || 0,
    totalJobs: (require('./utils/db').runQueryOne('SELECT COUNT(*) as count FROM job_requirements')?.count) || 0,
    pendingReviews: (require('./utils/db').runQueryOne("SELECT COUNT(*) as count FROM job_requirements WHERE status IN ('pending_review', 'ai_reviewed', 'manual_reviewed')")?.count) || 0,
    wageWarnings: (require('./utils/db').runQueryOne("SELECT COUNT(*) as count FROM wage_payments WHERE status = 'overdue'")?.count) || 0,
    reviewRecords: (require('./utils/db').runQuery('SELECT review_level, reviewer, result, comment, review_date FROM review_records ORDER BY review_date DESC LIMIT 5')) || [],
    message: '建筑业劳务后台管理统计接口'
  })
})

app.get('/api/admin/dashboard', (req: Request, res: Response) => {
  success(res, {
    module: 'admin-dashboard',
    user: currentUser,
    shortcuts: ['工人管理', '招工需求', '智能匹配', '合同管理', '工资支付']
  })
})

app.get('/api', (req: Request, res: Response) => {
  success(res, {
    name: '建筑业劳务供需智能撮合平台 API',
    version: '1.0.0',
    endpoints: [
      'GET /api/health',
      'GET /api/trades',
      'GET /api/trades/stats',
      'GET /api/workers',
      'POST /api/workers',
      'GET /api/workers/:id',
      'GET /api/jobs',
      'POST /api/jobs',
      'POST /api/jobs/:id/match',
      'GET /api/matches',
      'GET /api/contracts',
      'GET /api/analytics/dashboard-stats',
      'GET /api/analytics/region-heatmap',
      'GET /api/analytics/trade-shortage',
      'GET /api/analytics/team-credit',
      'GET /api/analytics/wage-arrears-risk'
    ]
  })
})

app.use('/api/trades', tradesRouter)
app.use('/api/workers', workersRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/matches', matchesRouter)
app.use('/api/contracts', contractsRouter)
app.use('/api/wage-payments', wagePaymentsRouter)
app.use('/api/employers', employersRouter)
app.use('/api/analytics', analyticsRouter)

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server Error:', err)
  error(res, err.message || '服务器内部错误', 500, 500)
})

app.use((req: Request, res: Response) => {
  error(res, '接口不存在', 404, 404)
})

function startServer() {
  console.log('\n========================================')
  console.log('  建筑业劳务供需智能撮合平台 - 后端服务')
  console.log('========================================\n')

  try {
    initDatabase()
    console.log('✓ 数据库初始化完成')

    initSeedData()
    console.log('✓ 种子数据初始化完成')
  } catch (err) {
    console.error('✗ 数据库初始化失败:', err)
    process.exit(1)
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`\n✓ 服务已启动`)
    console.log(`  监听地址: http://${HOST}:${PORT}`)
    console.log(`  API 前缀: http://${HOST}:${PORT}/api`)
    console.log(`  健康检查: http://${HOST}:${PORT}/api/health`)
    console.log(`  前端地址: http://127.0.0.1:${FRONTEND_PORT}`)
    console.log(`\n  数据库文件: ${path.resolve(__dirname, '../../data/app.sqlite')}`)
    console.log('\n========================================\n')
  })

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`✗ 端口 ${PORT} 已被占用，请检查或更换端口`)
      console.error(`  请使用: lsof -nP -iTCP:${PORT} -sTCP:LISTEN 查看占用进程`)
      process.exit(1)
    } else {
      console.error('✗ 服务器启动失败:', err)
      process.exit(1)
    }
  })

  process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，正在关闭服务...')
    server.close(() => {
      console.log('服务已关闭')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('\n收到 SIGINT 信号，正在关闭服务...')
    server.close(() => {
      console.log('服务已关闭')
      process.exit(0)
    })
  })
}

startServer()
