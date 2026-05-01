import 'reflect-metadata'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import http from 'http'
import { AppDataSource } from './config/database'
import routes from './routes'
import { successResponse, errorResponse } from './utils/response'
import { UserService } from './services/user.service'
import { RuleService } from './services/rule.service'
import { UserRole } from './entities'
import cron from 'node-cron'
import { ExpiryManager } from './engines/expiry-manager'
import { ExchangeService } from './services/exchange.service'

dotenv.config()

const app = express()

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      `http://localhost:${process.env.FRONTEND_PORT || 9877}`,
      `http://127.0.0.1:${process.env.FRONTEND_PORT || 9877}`,
      'http://localhost:9877',
      'http://127.0.0.1:9877',
      'http://localhost:9878',
      'http://127.0.0.1:9878',
      'http://localhost:9879',
      'http://127.0.0.1:9879',
      'http://localhost:9880',
      'http://127.0.0.1:9880',
    ]
    
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true)
    } else {
      callback(null, true)
    }
  },
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
  res.json(successResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: process.env.PORT,
  }))
})

app.use('/api', routes)

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json(errorResponse(err.message || '服务器内部错误', err.status || 500))
})

app.use('*', (req, res) => {
  res.status(404).json(errorResponse('路由不存在', 404))
})

async function createDefaultData() {
  console.log('检查并创建默认数据...')

  const userService = UserService.getInstance()
  const ruleService = RuleService.getInstance()

  const adminResult = await userService.register(
    'admin',
    'Admin@123',
    UserRole.ADMIN,
    { name: '系统管理员', email: 'admin@example.com' }
  )

  if (adminResult.success) {
    console.log('默认管理员账户创建成功: admin / Admin@123')
  } else {
    console.log('默认管理员账户已存在')
  }

  const managerResult = await userService.register(
    'manager',
    'Manager@123',
    UserRole.MANAGER,
    { name: '运营经理', email: 'manager@example.com' }
  )

  if (managerResult.success) {
    console.log('默认运营经理账户创建成功: manager / Manager@123')
  } else {
    console.log('默认运营经理账户已存在')
  }

  const financeResult = await userService.register(
    'finance',
    'Finance@123',
    UserRole.FINANCE,
    { name: '财务审计', email: 'finance@example.com' }
  )

  if (financeResult.success) {
    console.log('默认财务账户创建成功: finance / Finance@123')
  } else {
    console.log('默认财务账户已存在')
  }

  const employeeResult = await userService.register(
    'employee',
    'Employee@123',
    UserRole.EMPLOYEE,
    { name: '店员', email: 'employee@example.com' }
  )

  if (employeeResult.success) {
    console.log('默认店员账户创建成功: employee / Employee@123')
  } else {
    console.log('默认店员账户已存在')
  }

  const memberResult = await userService.register(
    'member',
    'Member@123',
    UserRole.MEMBER,
    { name: '测试会员', phone: '13800138000', email: 'member@example.com' }
  )

  if (memberResult.success) {
    console.log('默认测试会员账户创建成功: member / Member@123')
  } else {
    console.log('默认测试会员账户已存在')
  }

  await ruleService.createDefaultRules()
  console.log('默认规则创建完成')

  console.log('默认数据初始化完成')
}

function startScheduledTasks() {
  console.log('启动定时任务...')

  cron.schedule('0 2 * * *', async () => {
    console.log('执行每日积分效期检查任务...')
    try {
      const expiryManager = ExpiryManager.getInstance()
      const result = await expiryManager.scanAndProcess()
      console.log('效期检查完成:', JSON.stringify(result))
    } catch (error) {
      console.error('效期检查任务失败:', error)
    }
  })

  cron.schedule('*/30 * * * *', async () => {
    console.log('检查超时冻结订单...')
    try {
      const exchangeService = ExchangeService.getInstance()
      const result = await exchangeService.processTimeoutOrders()
      console.log('超时订单处理完成:', result.processedCount, '个订单')
    } catch (error) {
      console.error('超时订单处理失败:', error)
    }
  })

  console.log('定时任务启动完成')
}

const DEFAULT_PORT = 19876
const RESERVED_PORTS = [3000, 5173, 8080, 8000, 4200, 3001, 5174, 9876, 9877]
const ALTERNATE_PORTS = [19876, 19877, 19878, 19879, 19880, 18765, 17654, 16543, 15432, 14321]

async function startServer() {
  console.log('========================================')
  console.log('  会员积分系统 - 后端服务')
  console.log('========================================')
  
  let port = parseInt(process.env.PORT || String(DEFAULT_PORT))
  
  if (RESERVED_PORTS.includes(port)) {
    console.warn(`警告: 端口 ${port} 是常见端口，将使用默认端口 ${DEFAULT_PORT}`)
    port = DEFAULT_PORT
  }

  console.log(`正在初始化数据库连接...`)
  
  try {
    await AppDataSource.initialize()
    console.log('数据库连接成功')
  } catch (error: any) {
    console.error('数据库连接失败:', error.message)
    process.exit(1)
  }

  await createDefaultData()

  startScheduledTasks()

  function tryStartServer(tryPort: number, remainingPorts: number[]): void {
    const server = http.createServer(app)
    
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
        console.error(`端口 ${tryPort} 已被占用或无法访问`)
        
        if (remainingPorts.length > 0) {
          const nextPort = remainingPorts.shift()!
          console.log(`尝试切换到端口 ${nextPort}...`)
          tryStartServer(nextPort, remainingPorts)
        } else {
          console.error('========================================')
          console.error('  所有尝试的端口都无法使用！')
          console.error('========================================')
          console.error('建议操作:')
          console.error('1. 检查端口占用情况: netstat -ano | findstr :端口号')
          console.error('2. 结束占用端口的进程或使用其他端口')
          console.error('3. 通过环境变量 PORT 指定其他端口')
          console.error('4. 建议使用的稀有端口: 9876, 9877, 9878, 9879, 9880')
          console.error('========================================')
          process.exit(1)
        }
      } else {
        console.error('服务器启动失败:', err.message)
        process.exit(1)
      }
    })

    server.listen(tryPort, () => {
      console.log('========================================')
      console.log('  服务启动成功！')
      console.log('========================================')
      console.log(`服务地址: http://localhost:${tryPort}`)
      console.log(`健康检查: http://localhost:${tryPort}/health`)
      console.log(`API 路径: http://localhost:${tryPort}/api`)
      console.log('========================================')
      console.log('默认账户信息:')
      console.log('  管理员: admin / Admin@123')
      console.log('  运营经理: manager / Manager@123')
      console.log('  财务审计: finance / Finance@123')
      console.log('  店员: employee / Employee@123')
      console.log('  测试会员: member / Member@123')
      console.log('========================================')
      console.log('定时任务:')
      console.log('  每日 02:00: 积分效期检查和过期清零')
      console.log('  每 30 分钟: 检查超时冻结订单')
      console.log('========================================')
    })
  }

  const alternatePorts = ALTERNATE_PORTS.filter(p => p !== port)
  tryStartServer(port, alternatePorts)
}

startServer().catch((error) => {
  console.error('启动失败:', error)
  process.exit(1)
})
