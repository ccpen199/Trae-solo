import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { runMigrations } from './migrations.js'
import { seedData } from './seed.js'

import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import userRoutes from './routes/users.js'
import fleetRoutes from './routes/fleets.js'
import vehicleRoutes from './routes/vehicles.js'
import obuDeviceRoutes from './routes/obu-devices.js'
import obuUpgradeRoutes from './routes/obu-upgrades.js'
import tollRoutes from './routes/tolls.js'
import monthlyBillRoutes from './routes/monthly-bills.js'
import appealRoutes from './routes/appeals.js'
import accountRoutes from './routes/accounts.js'
import auditLogRoutes from './routes/audit-logs.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

runMigrations()
seedData()

const app: express.Application = express()

const FRONTEND_PORT = process.env.FRONTEND_PORT || '50054'
const BACKEND_PORT = process.env.BACKEND_PORT || '59054'

app.use(cors({
  origin: [
    `http://127.0.0.1:${FRONTEND_PORT}`,
    `http://localhost:${FRONTEND_PORT}`,
    'http://127.0.0.1:50054',
    'http://localhost:50054',
  ],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/users', userRoutes)
app.use('/api/fleets', fleetRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/obu-devices', obuDeviceRoutes)
app.use('/api/obu-upgrades', obuUpgradeRoutes)
app.use('/api/tolls', tollRoutes)
app.use('/api/monthly-bills', monthlyBillRoutes)
app.use('/api/appeals', appealRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/audit-logs', auditLogRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]', error)
  res.status(500).json({
    success: false,
    error: error.message || 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
